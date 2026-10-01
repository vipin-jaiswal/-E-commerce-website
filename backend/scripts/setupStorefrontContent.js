require("dotenv").config();

const domain = String(process.env.SHOPIFY_STORE_DOMAIN || "").trim().replace(/^https?:\/\//i, "").split(/[/?#]/)[0].toLowerCase();
const version = process.env.SHOPIFY_API_VERSION || "2026-07";

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
  if (!response.ok || payload.errors?.length) throw new Error(payload.errors?.map((error) => error.message).join(", ") || "Shopify Admin request failed");
  return payload.data;
};

const definitions = [
  {
    type: "$app:dyva_announcement",
    name: "DYVA Announcement",
    fieldDefinitions: [
      { key: "message", name: "Message", type: "multi_line_text_field" },
      { key: "enabled", name: "Enabled", type: "boolean" },
      { key: "link", name: "Link", type: "url" },
      { key: "sort_order", name: "Sort order", type: "number_integer" },
      { key: "starts_at", name: "Starts at", type: "date_time" },
      { key: "ends_at", name: "Ends at", type: "date_time" },
    ],
  },
  {
    type: "$app:dyva_hero_banner",
    name: "DYVA Hero Banner",
    fieldDefinitions: [
      { key: "desktop_image", name: "Desktop image", type: "file_reference" },
      { key: "mobile_image", name: "Mobile image", type: "file_reference" },
      { key: "heading", name: "Heading", type: "single_line_text_field" },
      { key: "subtitle", name: "Subtitle", type: "multi_line_text_field" },
      { key: "button_text", name: "Button text", type: "single_line_text_field" },
      { key: "button_url", name: "Button URL", type: "url" },
      { key: "enabled", name: "Enabled", type: "boolean" },
      { key: "sort_order", name: "Sort order", type: "number_integer" },
    ],
  },
  {
    type: "$app:dyva_concern",
    name: "DYVA Shop by Concern",
    access: { admin: "MERCHANT_READ_WRITE", storefront: "PUBLIC_READ" },
    fieldDefinitions: [
      { key: "name", name: "Name", type: "single_line_text_field" },
      { key: "query", name: "Product search term", type: "single_line_text_field" },
      { key: "category", name: "Category", type: "single_line_text_field" },
      { key: "image_url", name: "Image URL", type: "url" },
      { key: "enabled", name: "Enabled", type: "boolean" },
      { key: "sort_order", name: "Sort order", type: "number_integer" },
    ],
  },
];

const createDefinition = async (definition) => {
  const data = await request(
    `mutation CreateStorefrontContentDefinition($definition: MetaobjectDefinitionCreateInput!) {
      metaobjectDefinitionCreate(definition: $definition) {
        metaobjectDefinition { type name }
        userErrors { field message }
      }
    }`,
    { definition }
  );
  const result = data.metaobjectDefinitionCreate;
  if (result.userErrors.length) {
    const alreadyExists = result.userErrors.some((error) => /already exists|taken/i.test(error.message));
    if (!alreadyExists) throw new Error(result.userErrors.map((error) => error.message).join(", "));
    return { type: definition.type, status: "already exists" };
  }
  return { type: result.metaobjectDefinition.type, status: "created" };
};

(async () => {
  if (!domain) throw new Error("SHOPIFY_STORE_DOMAIN is missing");
  const results = [];
  for (const definition of definitions) results.push(await createDefinition(definition));
  console.log(JSON.stringify(results));
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
