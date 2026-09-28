require("dotenv").config();

const domain = String(process.env.SHOPIFY_STORE_DOMAIN || "")
  .trim()
  .replace(/^https?:\/\//i, "")
  .replace(/\/$/, "");

const version = process.env.SHOPIFY_API_VERSION || "2026-07";
const token = process.env.SHOPIFY_ADMIN_TOKEN;

const graphql = async (query, variables = {}) => {
  const response = await fetch(
    `https://${domain}/admin/api/${version}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  const payload = await response.json();

  if (!response.ok || payload.errors) {
    console.log("SHOPIFY API ERROR:");
    console.log(JSON.stringify(payload, null, 2));
    process.exit(1);
  }

  return payload.data;
};

const main = async () => {
  console.log("\n==============================");
  console.log(" DYVA BANNER CHECK");
  console.log("==============================\n");

  console.log("Store:", domain);
  console.log("Banner type:", process.env.SHOPIFY_HERO_BANNER_TYPE);

  const definitions = await graphql(`
    query {
      metaobjectDefinitions(first: 100) {
        nodes {
          id
          type
          name
          fieldDefinitions {
            key
            name
          }
        }
      }
    }
  `);

  console.log("\n=== BANNER DEFINITIONS ===\n");

  const matches = definitions.metaobjectDefinitions.nodes.filter((item) =>
    /banner|hero/i.test(`${item.name} ${item.type}`)
  );

  if (!matches.length) {
    console.log("❌ No banner definition found.");
  } else {
    for (const definition of matches) {
      console.log("NAME:", definition.name);
      console.log("TYPE:", definition.type);
      console.log("ID:", definition.id);

      console.log(
        "FIELDS:",
        definition.fieldDefinitions.map((field) => field.key).join(", ")
      );

      console.log("------------------------------");
    }
  }

  const bannerType = process.env.SHOPIFY_HERO_BANNER_TYPE;

  const entries = await graphql(
    `
      query Banners($type: String!) {
        metaobjects(type: $type, first: 50) {
          nodes {
            id
            type
            handle
            fields {
              key
              value
            }
          }
        }
      }
    `,
    { type: bannerType }
  );

  console.log("\n=== BANNER ENTRIES ===\n");

  const banners = entries.metaobjects?.nodes || [];

  console.log("Found:", banners.length);

  for (const banner of banners) {
    console.log("\nID:", banner.id);
    console.log("TYPE:", banner.type);
    console.log("HANDLE:", banner.handle);

    console.log(
      "FIELDS:",
      JSON.stringify(banner.fields, null, 2)
    );
  }

  console.log("\n==============================");
  console.log(" CHECK COMPLETED");
  console.log("==============================\n");
};

main().catch((error) => {
  console.error("\nFAILED:", error.message);
  process.exit(1);
});