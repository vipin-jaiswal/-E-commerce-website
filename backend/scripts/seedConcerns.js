require("dotenv").config();

const domain = String(process.env.SHOPIFY_STORE_DOMAIN || "")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");
const version = process.env.SHOPIFY_API_VERSION || "2026-07";
const type = process.env.SHOPIFY_CONCERN_TYPE || "app--428015452161--dyva_concern";

const concerns = [
  { handle: "acne", name: "Acne", query: "acne", category: "skin", order: 1 },
  { handle: "pigmentation", name: "Pigmentation", query: "pigmentation", category: "skin", order: 2 },
  { handle: "dry-skin", name: "Dry Skin", query: "dry skin", category: "skin", order: 3 },
  { handle: "dark-circles", name: "Dark Circles", query: "dark circles", category: "skin", order: 4 },
  { handle: "sun-burn", name: "Sun Burn", query: "sunscreen", category: "skin", order: 5 },
  { handle: "hair-fall", name: "Hair Fall", query: "hair fall", category: "hair", order: 6 },
];

const getAdminToken = async () => {
  if (process.env.SHOPIFY_ADMIN_TOKEN) return process.env.SHOPIFY_ADMIN_TOKEN;
  const response = await fetch(`https://${domain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) throw new Error(payload.error_description || "Unable to obtain Shopify Admin token");
  return payload.access_token;
};

const request = async (query, variables = {}) => {
  const response = await fetch(`https://${domain}/admin/api/${version}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": await getAdminToken(),
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok || payload.errors?.length) {
    throw new Error(payload.errors?.map((error) => error.message).join(", ") || "Shopify Admin request failed");
  }
  return payload.data;
};

(async () => {
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is missing");
  const existing = await request(`query ConcernHandles($type: String!) {
    metaobjects(type: $type, first: 100) { nodes { id handle fields { key value } } }
  }`, { type });
  const records = new Map((existing.metaobjects?.nodes || []).map((node) => [node.handle, node]));
  const created = [];

  for (const concern of concerns) {
    let record = records.get(concern.handle);
    if (!record) {
      const result = await request(`mutation CreateConcern($metaobject: MetaobjectCreateInput!) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject { id handle fields { key value } }
          userErrors { field message }
        }
      }`, {
        metaobject: {
          type,
          handle: concern.handle,
          fields: [
            { key: "name", value: concern.name },
            { key: "query", value: concern.query },
            { key: "category", value: concern.category },
            { key: "enabled", value: "true" },
            { key: "sort_order", value: String(concern.order) },
          ],
        },
      });
      const outcome = result.metaobjectCreate;
      if (outcome.userErrors.length) throw new Error(outcome.userErrors.map((error) => error.message).join(", "));
      record = outcome.metaobject;
      records.set(record.handle, record);
      created.push(record.handle);
    }

  }

  console.log(JSON.stringify({ status: "complete", created }));
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
