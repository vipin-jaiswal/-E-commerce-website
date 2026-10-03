const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-07";
const { REVIEW_TYPE } = require("./reviewMetaobject");

const normalizeDomain = (value) =>
  String(value || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .split(/[/?#]/)[0]
    .toLowerCase();

const shopDomain = normalizeDomain(process.env.SHOPIFY_STORE_DOMAIN);
let adminTokenPromise;

const readShopifyPayload = async (response, label) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    const preview = text
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/(access[_]?token|client_secret|client_id)["'=:\s]+[^&"\s,}]+/ig, "$1=[REDACTED]")
      .trim()
      .slice(0, 200);
    throw new Error(
      `${label} returned non-JSON (HTTP ${response.status}, content-type: ${response.headers.get("content-type") || "missing"}). ${preview}`
    );
  }
};

const getAdminToken = async () => {
  if (process.env.SHOPIFY_ADMIN_TOKEN) return process.env.SHOPIFY_ADMIN_TOKEN;
  if (adminTokenPromise) return adminTokenPromise;

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Shopify Admin credentials are missing");

  adminTokenPromise = fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  }).then(async (response) => {
    const payload = await readShopifyPayload(response, "Shopify Admin token endpoint");
    if (!response.ok || !payload.access_token) {
      throw new Error(`Shopify Admin authentication failed (HTTP ${response.status})`);
    }
    return payload.access_token;
  }).catch((error) => {
    adminTokenPromise = undefined;
    throw error;
  });

  return adminTokenPromise;
};

const adminGraphql = async (query, variables = {}) => {
  if (!shopDomain) throw new Error("SHOPIFY_STORE_DOMAIN is missing");
  const response = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": await getAdminToken(),
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await readShopifyPayload(response, "Shopify Admin GraphQL endpoint");
  if (!response.ok || payload.errors?.length) {
    const messages = (payload.errors || []).map((error) => error.message).join(", ");
    if (/No metaobject definition exists for type ["']?(?:\$app:dyva_product_review|app--\d+--dyva_product_review)/i.test(messages)) {
      throw new Error(
        `The Shopify app-owned review definition is missing. Run "npm.cmd run setup:reviews" from the backend folder to create or verify it for the configured app.`
      );
    }
    throw new Error(messages || `Shopify Admin request failed (HTTP ${response.status})`);
  }
  return payload.data;
};

const mapReview = (node) => {
  const fields = Object.fromEntries((node.fields || []).map(({ key, value }) => [key, value]));
  return {
    id: node.id,
    productHandle: fields.product_handle || "",
    author: fields.author || "Customer",
    rating: Number(fields.rating) || 0,
    title: fields.title || "",
    body: fields.body || "",
    date: fields.created_at || node.updatedAt || node.createdAt || "",
  };
};

const listProductReviews = async (handle) => {
  const data = await adminGraphql(
    `query ListDyvaProductReviews($type: String!) {
      metaobjects(type: $type, first: 250) {
        nodes { id updatedAt fields { key value } }
      }
    }`,
    { type: REVIEW_TYPE }
  );
  return (data.metaobjects?.nodes || [])
    .map(mapReview)
    .filter((review) => !handle || review.productHandle.toLowerCase() === String(handle).toLowerCase())
    .sort((left, right) => new Date(right.date) - new Date(left.date))
    .slice(0, handle ? 100 : 50);
};

const createProductReview = async ({ productHandle, author, rating, title, body }) => {
  const createdAt = new Date().toISOString();
  const data = await adminGraphql(
    `mutation CreateDyvaProductReview($review: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $review) {
        metaobject { id updatedAt fields { key value } }
        userErrors { field message code }
      }
    }`,
    {
      review: {
        type: REVIEW_TYPE,
        fields: [
          { key: "product_handle", value: productHandle },
          { key: "author", value: author },
          { key: "rating", value: String(rating) },
          { key: "title", value: title },
          { key: "body", value: body },
          { key: "created_at", value: createdAt },
        ],
      },
    }
  );
  const result = data.metaobjectCreate;
  if (result.userErrors?.length) {
    throw new Error(result.userErrors.map((error) => error.message).join(", "));
  }
  if (!result.metaobject) throw new Error("Shopify did not return the saved review");
  return mapReview(result.metaobject);
};

module.exports = { listProductReviews, createProductReview };
