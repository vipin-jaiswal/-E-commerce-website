require("dotenv").config();

const fs = require("node:fs/promises");
const path = require("node:path");

const domain = String(process.env.SHOPIFY_STORE_DOMAIN || "")
  .trim()
  .replace(/^https?:\/\//i, "")
  .replace(/\/$/, "");

const version = process.env.SHOPIFY_API_VERSION || "2026-07";

// Existing Shopify review metaobject type
const reviewType = "app--428015452161--dyva_product_review";

// Used only when creating the definition
const appOwnedReviewType = "$app:dyva_product_review";

const reviewsFile =
  process.env.REVIEWS_FILE ||
  path.join(__dirname, "..", "data", "reviews.json");

/* =========================================================
   SHOPIFY ADMIN TOKEN
========================================================= */

const getAdminToken = async () => {
  // If a permanent/server-side Admin token exists, use it.
  if (process.env.SHOPIFY_ADMIN_TOKEN) {
    return process.env.SHOPIFY_ADMIN_TOKEN;
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Shopify Admin credentials are missing. Add SHOPIFY_ADMIN_TOKEN or SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET to backend/.env"
    );
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
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  );

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload.access_token) {
    throw new Error(
      `Shopify Admin authentication failed (HTTP ${response.status}): ${JSON.stringify(
        payload
      )}`
    );
  }

  return payload.access_token;
};

/* =========================================================
   SHOPIFY ADMIN GRAPHQL REQUEST
========================================================= */

const request = async (query, variables = {}) => {
  const token = await getAdminToken();

  const response = await fetch(
    `https://${domain}/admin/api/${version}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    }
  );

  /*
   * Read response as text first.
   * This makes the error much easier to diagnose if Shopify
   * returns HTML or another non-JSON response.
   */
  const rawText = await response.text();

  let payload = {};

  try {
    payload = rawText ? JSON.parse(rawText) : {};
  } catch (error) {
    throw new Error(
      `Shopify returned a non-JSON response (HTTP ${response.status}): ${rawText.slice(
        0,
        500
      )}`
    );
  }

  /*
   * GraphQL errors can sometimes arrive in an unexpected shape.
   * Always normalize them into an array before using .map().
   */
  if (payload.errors) {
    const errors = Array.isArray(payload.errors)
      ? payload.errors
      : [payload.errors];

    const message = errors
      .map((error) => {
        if (typeof error === "string") {
          return error;
        }

        return error?.message || JSON.stringify(error);
      })
      .join(", ");

    throw new Error(
      message || `Shopify GraphQL error (HTTP ${response.status})`
    );
  }

  /*
   * HTTP-level error.
   */
  if (!response.ok) {
    throw new Error(
      `Shopify Admin request failed (HTTP ${response.status}): ${JSON.stringify(
        payload
      )}`
    );
  }

  /*
   * Shopify should return data for a successful GraphQL request.
   */
  if (!payload.data) {
    throw new Error(
      `Shopify response does not contain GraphQL data: ${JSON.stringify(
        payload
      )}`
    );
  }

  return payload.data;
};

/* =========================================================
   CREATE / VERIFY REVIEW METAOBJECT DEFINITION
========================================================= */

const ensureReviewDefinition = async () => {
  console.log("Checking Shopify review definition...");

  const existing = await request(
    `query FindReviewDefinition($type: String!) {
      metaobjectDefinitionByType(type: $type) {
        id
        type
        name
        fieldDefinitions {
          key
        }
      }
    }`,
    {
      type: reviewType,
    }
  );

  /*
   * Definition already exists.
   */
  if (existing.metaobjectDefinitionByType) {
    const definition = existing.metaobjectDefinitionByType;

    const requiredKeys = [
      "product_handle",
      "author",
      "rating",
      "title",
      "body",
      "created_at",
    ];

    const present = new Set(
      (definition.fieldDefinitions || []).map((field) => field.key)
    );

    const missing = requiredKeys.filter(
      (key) => !present.has(key)
    );

    if (missing.length) {
      throw new Error(
        `Existing ${reviewType} definition is missing fields: ${missing.join(
          ", "
        )}`
      );
    }

    console.log("Review definition already exists.");

    return {
      status: "already exists",
      type: definition.type,
      name: definition.name,
    };
  }

  /*
   * Definition doesn't exist.
   * Create it.
   */
  console.log("Creating Shopify review definition...");

  const created = await request(
    `mutation CreateReviewDefinition(
      $definition: MetaobjectDefinitionCreateInput!
    ) {
      metaobjectDefinitionCreate(
        definition: $definition
      ) {
        metaobjectDefinition {
          type
          name
        }
        userErrors {
          field
          message
          code
        }
      }
    }`,
    {
      definition: {
        type: appOwnedReviewType,
        name: "DYVA Product Review",

        access: {
          admin: "MERCHANT_READ_WRITE",
          storefront: "NONE",
        },

        fieldDefinitions: [
          {
            key: "product_handle",
            name: "Product handle",
            type: "single_line_text_field",
            required: true,
          },
          {
            key: "author",
            name: "Reviewer name",
            type: "single_line_text_field",
            required: true,
          },
          {
            key: "rating",
            name: "Star rating",
            type: "number_integer",
            required: true,
          },
          {
            key: "title",
            name: "Review title",
            type: "single_line_text_field",
          },
          {
            key: "body",
            name: "Review",
            type: "multi_line_text_field",
            required: true,
          },
          {
            key: "created_at",
            name: "Submitted at",
            type: "date_time",
            required: true,
          },
        ],
      },
    }
  );

  const result = created.metaobjectDefinitionCreate;

  /*
   * Handle Shopify userErrors safely.
   */
  if (result?.userErrors?.length) {
    const message = result.userErrors
      .map((error) => error?.message || JSON.stringify(error))
      .join(", ");

    throw new Error(message);
  }

  if (!result?.metaobjectDefinition) {
    throw new Error(
      "Shopify did not return the created review definition."
    );
  }

  console.log("Review definition created.");

  return {
    status: "created",
    ...result.metaobjectDefinition,
  };
};

/* =========================================================
   MIGRATE LOCAL REVIEWS TO SHOPIFY
========================================================= */

const migrateLocalReviews = async () => {
  let localReviews = [];

  try {
    const contents = await fs.readFile(
      reviewsFile,
      "utf8"
    );

    const parsed = JSON.parse(contents);

    localReviews = Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  /*
   * No local reviews.
   */
  if (!localReviews.length) {
    console.log("No local reviews found.");

    return {
      found: 0,
      migrated: 0,
      alreadyPresent: 0,
    };
  }

  console.log(
    `Found ${localReviews.length} local review(s).`
  );

  /*
   * Get existing Shopify reviews.
   */
  const existing = await request(
    `query ExistingReviewsForMigration($type: String!) {
      metaobjects(type: $type, first: 250) {
        nodes {
          handle
        }
      }
    }`,
    {
      type: reviewType,
    }
  );

  const handles = new Set(
    (existing.metaobjects?.nodes || []).map(
      (node) => node.handle
    )
  );

  let migrated = 0;
  let alreadyPresent = 0;

  /* =======================================================
     MIGRATE EACH REVIEW
  ======================================================= */

  for (const review of localReviews) {
    const legacyId = String(
      review.id ||
        `${review.productHandle}-${review.date}-${review.author}`
    )
      .replace(/[^a-z0-9-]/gi, "-")
      .slice(0, 220);

    const handle = `legacy-${legacyId || migrated}`;

    /*
     * Don't migrate the same review twice.
     */
    if (handles.has(handle)) {
      alreadyPresent += 1;

      console.log(
        `Skipping existing review: ${handle}`
      );

      continue;
    }

    /*
     * Normalize review date.
     */
    const createdAt =
      review.date &&
      Number.isFinite(Date.parse(review.date))
        ? new Date(review.date).toISOString()
        : new Date().toISOString();

    console.log(
      `Migrating review: ${review.author} → ${review.productHandle}`
    );

    const result = await request(
      `mutation MigrateLegacyReview(
        $review: MetaobjectCreateInput!
      ) {
        metaobjectCreate(
          metaobject: $review
        ) {
          metaobject {
            id
          }
          userErrors {
            field
            message
            code
          }
        }
      }`,
      {
        review: {
          type: reviewType,
          handle,

          fields: [
            {
              key: "product_handle",
              value: String(
                review.productHandle || ""
              ),
            },
            {
              key: "author",
              value: String(
                review.author ||
                  review.customerName ||
                  "Customer"
              ),
            },
            {
              key: "rating",
              value: String(
                Number(review.rating) || 0
              ),
            },
            {
              key: "title",
              value: String(
                review.title || ""
              ),
            },
            {
              key: "body",
              value: String(
                review.body ||
                  review.text ||
                  ""
              ),
            },
            {
              key: "created_at",
              value: createdAt,
            },
          ],
        },
      }
    );

    const mutation =
      result.metaobjectCreate;

    /*
     * Handle mutation errors.
     */
    if (mutation?.userErrors?.length) {
      const message = mutation.userErrors
        .map(
          (error) =>
            error?.message ||
            JSON.stringify(error)
        )
        .join(", ");

      throw new Error(
        `Failed to migrate review "${handle}": ${message}`
      );
    }

    if (!mutation?.metaobject) {
      throw new Error(
        `Shopify did not return the migrated review for "${handle}".`
      );
    }

    handles.add(handle);
    migrated += 1;

    console.log(
      `✓ Migrated review: ${handle}`
    );
  }

  return {
    found: localReviews.length,
    migrated,
    alreadyPresent,
  };
};

/* =========================================================
   MAIN
========================================================= */

const main = async () => {
  if (!domain) {
    throw new Error(
      "SHOPIFY_STORE_DOMAIN is missing"
    );
  }

  console.log("");
  console.log("========================================");
  console.log("      DYVA SHOPIFY REVIEW SETUP");
  console.log("========================================");
  console.log("");

  console.log(`Shopify store: ${domain}`);
  console.log(`API version: ${version}`);
  console.log(`Review type: ${reviewType}`);
  console.log("");

  /*
   * Step 1:
   * Make sure the review metaobject definition exists.
   */
  const definition =
    await ensureReviewDefinition();

  /*
   * Step 2:
   * Move local reviews into Shopify.
   */
  const migration =
    await migrateLocalReviews();

  console.log("");
  console.log("========================================");
  console.log("              COMPLETED");
  console.log("========================================");

  console.log(
    JSON.stringify(
      {
        definition,
        migration,
      },
      null,
      2
    )
  );
};

/* =========================================================
   ERROR HANDLER
========================================================= */

main().catch((error) => {
  console.error("");
  console.error("========================================");
  console.error("          REVIEW SETUP FAILED");
  console.error("========================================");
  console.error("");

  console.error(error.message);

  if (error.stack) {
    console.error("");
    console.error(error.stack);
  }

  process.exitCode = 1;
});