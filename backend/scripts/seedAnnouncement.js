require("dotenv").config();

const domain = String(process.env.SHOPIFY_STORE_DOMAIN || "")
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "");

const version = process.env.SHOPIFY_API_VERSION || "2026-07";
const type =
  process.env.SHOPIFY_ANNOUNCEMENT_TYPE ||
  "app--428015452161--dyva_announcement";

const handle = "dyva-announcement-default";

const getAdminToken = async () => {
  if (process.env.SHOPIFY_ADMIN_TOKEN) {
    return process.env.SHOPIFY_ADMIN_TOKEN;
  }

  const response = await fetch(
    `https://${domain}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      }),
    }
  );

  const payload = await response.json();

  if (!response.ok || !payload.access_token) {
    throw new Error(
      payload.error_description ||
        "Unable to obtain Shopify Admin token"
    );
  }

  return payload.access_token;
};

const request = async (query, variables = {}) => {
  const response = await fetch(
    `https://${domain}/admin/api/${version}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": await getAdminToken(),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    }
  );

  const payload = await response.json();

  if (!response.ok || payload.errors?.length) {
    throw new Error(
      payload.errors
        ?.map((error) => error.message)
        .join(", ") || "Shopify Admin request failed"
    );
  }

  return payload.data;
};

const findAnnouncement = async () => {
  const result = await request(
    `
      query FindAnnouncement($type: String!, $handle: String!) {
        metaobjects(
          type: $type
          first: 10
          query: $handle
        ) {
          nodes {
            id
            handle
            type
            fields {
              key
              value
            }
          }
        }
      }
    `,
    {
      type,
      handle,
    }
  );

  return result.metaobjects.nodes.find(
    (node) => node.handle === handle
  );
};

const createAnnouncement = async () => {
  /*
   * This message is only used when the metaobject
   * does not exist yet.
   *
   * Once the announcement exists in Shopify,
   * the frontend reads the message directly from
   * Shopify Storefront API.
   */
  const result = await request(
    `
      mutation CreateAnnouncement(
        $metaobject: MetaobjectCreateInput!
      ) {
        metaobjectCreate(metaobject: $metaobject) {
          metaobject {
            id
            handle
          }
          userErrors {
            field
            message
          }
        }
      }
    `,
    {
      metaobject: {
        type,
        handle,
        fields: [
          {
            key: "message",
            value:
              "Flat 40% OFF on Best Sellers - Free Shipping Above INR 499 - Buy 2 Get 1 Free - COD Available - Premium Hair Products",
          },
          {
            key: "enabled",
            value: "true",
          },
          {
            key: "sort_order",
            value: "0",
          },
        ],
      },
    }
  );

  const errors =
    result.metaobjectCreate.userErrors || [];

  if (errors.length) {
    throw new Error(
      errors.map((error) => error.message).join(", ")
    );
  }

  return result.metaobjectCreate.metaobject;
};

(async () => {
  try {
    if (!domain) {
      throw new Error(
        "SHOPIFY_STORE_DOMAIN is missing"
      );
    }

    if (!type) {
      throw new Error(
        "SHOPIFY_ANNOUNCEMENT_TYPE is missing"
      );
    }

    const existing = await findAnnouncement();

    if (existing) {
      console.log(
        JSON.stringify(
          {
            status: "exists",
            id: existing.id,
            type: existing.type,
            handle: existing.handle,
            fieldKeys: existing.fields.map(
              (field) => field.key
            ),
          },
          null,
          2
        )
      );

      return;
    }

    const created = await createAnnouncement();

    console.log(
      JSON.stringify(
        {
          status: "created",
          id: created.id,
          handle: created.handle,
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
})();