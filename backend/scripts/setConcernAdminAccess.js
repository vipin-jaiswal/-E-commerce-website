require("dotenv").config();

const domain = String(process.env.SHOPIFY_STORE_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
const version = process.env.SHOPIFY_API_VERSION || "2026-07";
const type = process.env.SHOPIFY_CONCERN_TYPE || "app--428015452161--dyva_concern";

const token = async () => {
  if (process.env.SHOPIFY_ADMIN_TOKEN) return process.env.SHOPIFY_ADMIN_TOKEN;
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.SHOPIFY_CLIENT_ID, client_secret: process.env.SHOPIFY_CLIENT_SECRET }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || "Unable to obtain Shopify Admin token");
  return payload.access_token;
};

const request = async (query, variables = {}) => {
  const response = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": await token() },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) throw new Error(payload.errors?.map((error) => error.message).join(", ") || "Shopify Admin request failed");
  return payload.data;
};

(async () => {
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is missing");
  const found = await request(`query ConcernDefinition($type: String!) {
    metaobjectDefinitionByType(type: $type) { id type name access { admin storefront } }
  }`, { type });
  const definition = found.metaobjectDefinitionByType;
  if (!definition) throw new Error(`Shopify metaobject definition not found: ${type}`);
  const updated = await request(`mutation EnableConcernAdmin($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition { type name access { admin storefront } }
      userErrors { field message }
    }
  }`, { id: definition.id, definition: { access: { admin: "MERCHANT_READ_WRITE", storefront: "PUBLIC_READ" } } });
  const result = updated.metaobjectDefinitionUpdate;
  if (result.userErrors.length) throw new Error(result.userErrors.map((error) => error.message).join(", "));
  const entries = await request(`query ConcernEntries($type: String!) {
    metaobjects(type: $type, first: 50) { nodes { handle } }
  }`, { type });
  console.log(JSON.stringify({ definition: result.metaobjectDefinition, entryHandles: (entries.metaobjects?.nodes || []).map((entry) => entry.handle) }));
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
