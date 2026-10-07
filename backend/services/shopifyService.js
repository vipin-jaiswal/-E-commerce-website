const crypto = require("crypto");

const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-07";

const SHOPIFY_PRODUCT_QUERY =
  process.env.SHOPIFY_PRODUCT_QUERY || "status:active";

const SHOPIFY_ANNOUNCEMENT_TYPE =
  process.env.SHOPIFY_ANNOUNCEMENT_TYPE || "announcement_bar";

const SHOPIFY_HERO_BANNER_TYPE =
  process.env.SHOPIFY_HERO_BANNER_TYPE || "banner";

const SHOPIFY_CONCERN_TYPE =
  process.env.SHOPIFY_CONCERN_TYPE || "$app:dyva_concern";

const SHOPIFY_EXCLUDED_PRODUCT_HANDLES = new Set(
  (process.env.SHOPIFY_EXCLUDED_PRODUCT_HANDLES || "")
    .split(",")
    .map((handle) => handle.trim())
    .filter(Boolean)
);

let adminTokenPromise;
const codOrderRequests = new Map();

let storefrontContentCache = {
  expiresAt: 0,
  value: null,
};

const normalizeShopDomain = (value) =>
  String(value || "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

const shopDomain = normalizeShopDomain(SHOPIFY_STORE_DOMAIN);

/* =========================================================
   GRAPHQL REQUEST
========================================================= */

const requestGraphql = async (
  url,
  headers,
  query,
  variables = {}
) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const text = await response.text();

  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(
      `Shopify returned a non-JSON response (HTTP ${response.status})`
    );
  }

  if (!response.ok || payload.errors) {
    const graphQLErrors = Array.isArray(payload.errors)
      ? payload.errors
      : [payload.errors];

    if (graphQLErrors.length) {
      const apiName = new URL(url).pathname.includes("/admin/")
        ? "Admin"
        : "Storefront";

      console.error(
        `[shopify] ${apiName} GraphQL error:`,
        JSON.stringify(
          graphQLErrors.map((error) =>
            typeof error === "string"
              ? { message: error }
              : {
                  message: error?.message,
                  path: error?.path,
                  extensions: error?.extensions,
                }
          )
        )
      );
    }

    const messages = graphQLErrors
      .map((error) => typeof error === "string" ? error : error?.message)
      .filter(Boolean)
      .join(", ");

    if (response.status === 402 || /unavailable shop/i.test(messages)) {
      throw new Error(
        "Shopify store is unavailable (HTTP 402). Reactivate the store or resolve its billing issue in Shopify Admin."
      );
    }

    throw new Error(
      messages ||
        `Shopify API request failed (HTTP ${response.status})`
    );
  }

  return payload.data;
};

/* =========================================================
   SHOPIFY URLS
========================================================= */

const requireShopDomain = () => {
  if (!shopDomain) {
    throw new Error("SHOPIFY_STORE_DOMAIN is missing");
  }

  return shopDomain;
};

const storefrontUrl = () =>
  `https://${requireShopDomain()}/api/${SHOPIFY_API_VERSION}/graphql.json`;

const adminUrl = () =>
  `https://${requireShopDomain()}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

/* =========================================================
   ADMIN TOKEN
========================================================= */

const getAdminToken = async () => {
  if (process.env.SHOPIFY_ADMIN_TOKEN) {
    return process.env.SHOPIFY_ADMIN_TOKEN;
  }

  if (adminTokenPromise) {
    return adminTokenPromise;
  }

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Shopify Admin credentials are missing");
  }

  adminTokenPromise = fetch(
    `https://${requireShopDomain()}/admin/oauth/access_token`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  )
    .then(async (response) => {
      const text = await response.text();

      let payload;

      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error(
          `Shopify token endpoint returned non-JSON (HTTP ${response.status})`
        );
      }

      if (!response.ok || !payload.access_token) {
        throw new Error(
          payload.error_description ||
            payload.error ||
            `Shopify token request failed (HTTP ${response.status})`
        );
      }

      return payload.access_token;
    })
    .catch((error) => {
      adminTokenPromise = undefined;
      throw error;
    });

  return adminTokenPromise;
};

/* =========================================================
   GRAPHQL CLIENTS
========================================================= */

const adminGraphql = async (query, variables) =>
  requestGraphql(
    adminUrl(),
    {
      "X-Shopify-Access-Token":
        await getAdminToken(),
    },
    query,
    variables
  );

const storefrontGraphql = async (
  query,
  variables
) => {
  if (!SHOPIFY_STOREFRONT_TOKEN) {
    throw new Error(
      "SHOPIFY_STOREFRONT_TOKEN is missing"
    );
  }

  try {
    return await requestGraphql(
      storefrontUrl(),
      {
        "X-Shopify-Storefront-Access-Token":
          SHOPIFY_STOREFRONT_TOKEN,
      },
      query,
      variables
    );
  } catch (error) {
    const operation = query.match(/\b(?:query|mutation)\s+([A-Za-z0-9_]+)/)?.[1];
    if (operation?.startsWith("Cart")) {
      const cartId = variables?.cartId || variables?.id;
      logCartDiagnostics(
        operation,
        cartId ? { id: cartId } : null,
        [],
        [error.message]
      );
    }
    throw error;
  }
};

/* =========================================================
   PRODUCT FIELDS
========================================================= */

const storefrontProductFields = `
  id
  handle
  title
  description
  descriptionHtml
  vendor
  productType
  tags
  availableForSale

  featuredImage {
    url
    altText
  }

  images(first: 20) {
    nodes {
      url
      altText
    }
  }

  variants(first: 50) {
    nodes {
      id
      title
      availableForSale

      price {
        amount
        currencyCode
      }

      compareAtPrice {
        amount
        currencyCode
      }
    }
  }
`;

const adminProductFields = `
  id
  handle
  title
  descriptionHtml
  vendor
  productType
  tags
  status

  featuredImage {
    url
    altText
  }

  images(first: 20) {
    nodes {
      url
      altText
    }
  }

  variants(first: 50) {
    nodes {
      id
      title
      availableForSale
      quantityAvailable
      inventoryQuantity
      price
      compareAtPrice
    }
  }
`;

/* =========================================================
   MONEY
========================================================= */

const moneyAmount = (value) =>
  typeof value === "object"
    ? value?.amount
    : value;

/* =========================================================
   NORMALIZE PRODUCT
========================================================= */

const normalizeProduct = (product) => {
  const variants = product.variants?.nodes || [];

  const firstVariant = variants[0];

  const images =
    product.images?.nodes
      ?.map((image) => image.url)
      .filter(Boolean) || [];

  const hasAvailableVariant = variants.some(
    (variant) =>
      variant.availableForSale === true
  );

  const isAvailable = variants.length
    ? hasAvailableVariant
    : Boolean(
        product.availableForSale ??
          (product.status === "ACTIVE")
      );

  const normalizedVariants = variants.map(
    (variant) => ({
      id: variant.id,
      title: variant.title,

      price: Number(
        moneyAmount(variant.price) || 0
      ),

      compareAtPrice:
        variant.compareAtPrice
          ? Number(
              moneyAmount(
                variant.compareAtPrice
              ) || 0
            )
          : null,

      availableForSale:
        variant.availableForSale === true,

      quantityAvailable:
        variant.quantityAvailable !==
          undefined &&
        variant.quantityAvailable !== null
          ? Number(
              variant.quantityAvailable
            )
          : variant.inventoryQuantity !==
                undefined &&
            variant.inventoryQuantity !== null
          ? Number(
              variant.inventoryQuantity
            )
          : null,
    })
  );

  const productTags = Array.isArray(
    product.tags
  )
    ? product.tags
    : [];

  const productType = String(
    product.productType || ""
  );

  const productHandle = String(
    product.handle || ""
  );

  const isHairCare =
    /hair/i.test(productType) ||
    productTags.some((tag) =>
      /hair/i.test(tag)
    ) ||
    /hair/i.test(productHandle);

  const comingSoon = !isHairCare;

  const hasSpecificQuantities =
    normalizedVariants.some(
      (variant) =>
        typeof variant.quantityAvailable ===
        "number"
    );

  const computedStock =
    hasSpecificQuantities
      ? normalizedVariants.reduce(
          (total, variant) =>
            total +
            Number(
              variant.quantityAvailable || 0
            ),
          0
        )
      : isAvailable
      ? null
      : 0;

  return {
    id: product.handle,
    shopifyId: product.id,
    handle: product.handle,

    name: product.title,
    title: product.title,

    description:
      product.description ||
      product.descriptionHtml ||
      "",

    brand: product.vendor || "",

    category: product.productType || "",

    categories: product.productType
      ? [product.productType]
      : [],

    tags: productTags,

    images:
      images.length
        ? images
        : product.featuredImage?.url
        ? [product.featuredImage.url]
        : [],

    price: Number(
      moneyAmount(firstVariant?.price) || 0
    ),

    salePrice:
      firstVariant?.compareAtPrice
        ? Number(
            moneyAmount(
              firstVariant.compareAtPrice
            ) || 0
          )
        : null,

    stock: computedStock,

    availableForSale: Boolean(
      isAvailable
    ),

    comingSoon,

    variants: normalizedVariants,

    weights: variants
      .map((variant) => variant.title)
      .filter(
        (title) =>
          title &&
          title !== "Default Title"
      ),
  };
};

/* =========================================================
   PRODUCTS
========================================================= */

const fetchProducts = async ({
  first = 24,
  query = "",
} = {}) => {
  const useStorefront =
    Boolean(SHOPIFY_STOREFRONT_TOKEN);

  const graphql = useStorefront
    ? storefrontGraphql
    : adminGraphql;

  const fields = useStorefront
    ? storefrontProductFields
    : adminProductFields;

  const escapedSearchTerm = String(query || "")
    .trim()
    .replace(/[\\"():]/g, "\\$&");
  const searchFields = ["title", "product_type", "vendor", "tag"];
  const exactSearch = escapedSearchTerm
    ? `(${searchFields.map((field) => `${field}:"${escapedSearchTerm}"`).join(" OR ")})`
    : "";

  const buildProductQuery = (search) =>
    [SHOPIFY_PRODUCT_QUERY, search]
      .filter(Boolean)
      .map((part) => `(${part})`)
      .join(" AND ") || null;

  const fetchByQuery = async (search) => {
    const data = await graphql(
      `query Products($first: Int!, $query: String) {
        products(first: $first, query: $query) {
          nodes {
            ${fields}
          }
        }
      }`,
      { first, query: buildProductQuery(search) }
    );

    return data.products.nodes
      .filter(
        (product) =>
          !SHOPIFY_EXCLUDED_PRODUCT_HANDLES.has(
            product.handle
          )
      )
      .map(normalizeProduct);
  };

  let products = await fetchByQuery(exactSearch);

  // Shopify treats whitespace as AND. If a multiword concern has no exact
  // phrase match, retry against each word across the existing searchable fields.
  if (!products.length && escapedSearchTerm) {
    const terms = [...new Set(escapedSearchTerm.split(/\s+/).filter(Boolean))];
    if (terms.length > 1) {
      const broadSearch = `(${terms.flatMap((term) =>
        searchFields.map((field) => `${field}:${term}`)
      ).join(" OR ")})`;
      products = await fetchByQuery(broadSearch);
    }
  }

  return {
    products,
    total: products.length,
  };
};

/* =========================================================
   SINGLE PRODUCT
========================================================= */

const fetchProduct = async (handle) => {
  const useStorefront =
    Boolean(SHOPIFY_STOREFRONT_TOKEN);

  if (useStorefront) {
    const data =
      await storefrontGraphql(
        `query Product($handle: String!) {
          product(handle: $handle) {
            ${storefrontProductFields}
          }
        }`,
        { handle }
      );

    return data.product
      ? normalizeProduct(data.product)
      : null;
  }

  const data = await adminGraphql(
    `query ProductByHandle($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          ${adminProductFields}
        }
      }
    }`,
    {
      query: `handle:${handle}`,
    }
  );

  const product =
    data.products.nodes[0];

  return product &&
    !SHOPIFY_EXCLUDED_PRODUCT_HANDLES.has(
      product.handle
    )
    ? normalizeProduct(product)
    : null;
};

/* =========================================================
   METAOBJECT HELPERS
========================================================= */

const metaobjectFields = (
  metaobject
) =>
  Object.fromEntries(
    (metaobject?.fields || []).map(
      (field) => [
        field.key,
        field.value,
      ]
    )
  );

/* =========================================================
   RESOLVE BANNER IMAGES
========================================================= */

const resolveMetaobjectImages = async (
  records
) => {
  const ids = records
    .flatMap((record) => [
      record.banner_image,
      record.mobile,
    ])
    .filter(
      (value) =>
        typeof value === "string" &&
        value.startsWith("gid://")
    );

  if (!ids.length) {
    return new Map();
  }

  const uniqueIds = [
    ...new Set(ids),
  ];

  const data =
    await storefrontGraphql(
      `query StorefrontContentImages($ids: [ID!]!) {
        nodes(ids: $ids) {
          id

          ... on MediaImage {
            image {
              url
            }
          }

          ... on GenericFile {
            url
          }
        }
      }`,
      {
        ids: uniqueIds,
      }
    );

  return new Map(
    (data.nodes || []).map(
      (node) => [
        node.id,
        node.image?.url ||
          node.url ||
          null,
      ]
    )
  );
};

/* =========================================================
   CONTENT VISIBILITY
========================================================= */

const isVisibleContent = (
  fields
) => {
  const active =
    fields.enabled ??
    fields.active;

  if (
    String(active).toLowerCase() ===
    "false"
  ) {
    return false;
  }

  const now = Date.now();

  const startsAt = fields.starts_at
    ? Date.parse(fields.starts_at)
    : NaN;

  const endsAt = fields.ends_at
    ? Date.parse(fields.ends_at)
    : NaN;

  return (
    (!Number.isFinite(startsAt) ||
      startsAt <= now) &&
    (!Number.isFinite(endsAt) ||
      endsAt >= now)
  );
};

const isTrue = (value) =>
  value === true ||
  String(value).toLowerCase() ===
    "true";

/* =========================================================
   STOREFRONT CONTENT
========================================================= */

const fetchAllStorePolicies = async () => {
  const data = await adminGraphql(`query StorePolicies {
    shop {
      shopPolicies {
        type
        title
        body
        url
      }
    }
  }`);

  return data.shop?.shopPolicies || [];
};

const fetchStorePolicies = async () =>
  (await fetchAllStorePolicies()).filter((policy) =>
    ["SHIPPING_POLICY", "REFUND_POLICY"].includes(policy.type)
  );

const fetchStorefrontContent =
  async () => {
    if (
      storefrontContentCache.value &&
      storefrontContentCache.expiresAt >
        Date.now()
    ) {
      return storefrontContentCache.value;
    }

    let storefrontConcernType = SHOPIFY_CONCERN_TYPE;
    if (storefrontConcernType.startsWith("$app:")) {
      const definitionData = await adminGraphql(
        `query ResolveConcernDefinitionType($type: String!) {
          metaobjectDefinitionByType(type: $type) { type }
        }`,
        { type: storefrontConcernType }
      );
      storefrontConcernType = definitionData.metaobjectDefinitionByType?.type;
      if (!storefrontConcernType) {
        throw new Error(
          `Shopify concern definition ${SHOPIFY_CONCERN_TYPE} is missing. Run "npm.cmd run setup:shopify-metaobjects" from the backend folder.`
        );
      }
    }

    const data =
      await storefrontGraphql(
        `query StorefrontContent(
          $announcementType: String!
          $bannerType: String!
          $concernType: String!
        ) {

          announcements: metaobjects(
            type: $announcementType
            first: 20
          ) {
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

          banners: metaobjects(
            type: $bannerType
            first: 50
          ) {
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

          concerns: metaobjects(
            type: $concernType
            first: 50
          ) {
            nodes {
              id
              handle
              fields {
                key
                value
              }
            }
          }
        }`,
        {
          announcementType:
            SHOPIFY_ANNOUNCEMENT_TYPE,

          bannerType:
            SHOPIFY_HERO_BANNER_TYPE,

          concernType:
            storefrontConcernType,
        }
      );

    /* =====================================================
       ANNOUNCEMENTS
    ===================================================== */

    const announcements = (
      data.announcements?.nodes ||
      []
    )
      .map((node) => ({
        handle: node.handle,

        ...metaobjectFields(node),

        id: node.id,

        type: node.type,
      }))
      .filter((fields) => {
        const message =
          fields.text ||
          fields.message ||
          fields.announcement ||
          fields.content;

        return (
          isVisibleContent(fields) &&
          Boolean(
            String(message || "").trim()
          )
        );
      })
      .sort(
        (left, right) =>
          Number(
            left.order ??
              left.sort_order ??
              0
          ) -
          Number(
            right.order ??
              right.sort_order ??
              0
          )
      );

    /* =====================================================
       BANNERS
    ===================================================== */

    const bannerRecords = (
      data.banners?.nodes || []
    )
      .map((node) => {
        const fields =
          metaobjectFields(node);

        return {
          ...fields,

          id: node.id,
          type: node.type,
          handle: node.handle,

          /*
           * Actual Shopify definition:
           *
           * banner_image
           * mobile
           * banner_link
           * active
           * order
           */

          banner_image:
            fields.banner_image ||
            fields.desktop_image ||
            fields.image ||
            "",

          mobile:
            fields.mobile ||
            fields.mobile_image ||
            "",

          banner_link:
            fields.banner_link ||
            fields.button_url ||
            fields.link ||
            "",

          active:
            fields.active ??
            fields.enabled,

          order:
            fields.order ??
            fields.sort_order ??
            0,
        };
      })
      .filter((fields) =>
        isTrue(fields.active)
      );

    /* =====================================================
       IMAGE URL RESOLUTION
    ===================================================== */

    const imageUrls =
      await resolveMetaobjectImages(
        bannerRecords
      );

    /* =====================================================
       NORMALIZE BANNERS
    ===================================================== */

    const banners = bannerRecords
      .map((fields) => {
        const image =
          imageUrls.get(
            fields.banner_image
          ) ||
          fields.banner_image_url ||
          (String(
            fields.banner_image || ""
          ).startsWith("http")
            ? fields.banner_image
            : "");

        const mobileImage =
          imageUrls.get(
            fields.mobile
          ) ||
          fields.mobile_image_url ||
          (String(
            fields.mobile || ""
          ).startsWith("http")
            ? fields.mobile
            : "");

        const order = Number(
          fields.order || 0
        );

        return {
          id:
            fields.id ||
            fields.handle,

          type: fields.type,

          handle: fields.handle,

          image,

          desktopImage: image,

          mobileImage,

          link:
            fields.banner_link || "",

          active: true,

          order,

          sortOrder: order,

          heading:
            fields.heading || "",

          subtitle:
            fields.subtitle || "",

          buttonText:
            fields.button_text || "",

          buttonUrl:
            fields.button_url ||
            fields.banner_link ||
            "",
        };
      })
      .filter(
        (banner) =>
          banner.image ||
          banner.mobileImage
      )
      .sort(
        (left, right) =>
          left.order - right.order
      );

    const concerns = (data.concerns?.nodes || [])
      .map((node) => ({
        ...metaobjectFields(node),
        id: node.id,
        handle: node.handle,
      }))
      .filter((fields) =>
        isVisibleContent(fields) &&
        Boolean(String(fields.name || "").trim()) &&
        Boolean(String(fields.query || "").trim())
      )
      .map((fields) => ({
        id: fields.id || fields.handle,
        name: fields.name,
        query: fields.query,
        category: String(fields.category || "skin").toLowerCase(),
        image: fields.image_url || "",
        order: Number(fields.sort_order || fields.order || 0),
      }))
      .sort((left, right) => left.order - right.order);

    /* =====================================================
       FINAL CONTENT
    ===================================================== */

    const value = {
      announcement:
        announcements[0]
          ? {
              message:
                announcements[0].text ||
                announcements[0].message ||
                announcements[0].announcement ||
                announcements[0].content ||
                "",

              link:
                announcements[0].link ||
                announcements[0].url ||
                "",
            }
          : null,

      banners,
      concerns,
    };

    storefrontContentCache = {
      value,

      /*
       * Keep Shopify edits visible quickly while avoiding repeated requests.
       */
      expiresAt:
        Date.now() + 5_000,
    };

    return value;
  };

/* =========================================================
   CART FIELDS
========================================================= */

const cartFields = `
  id
  checkoutUrl
  totalQuantity

  discountCodes {
    code
    applicable
  }

  cost {
    subtotalAmount {
      amount
      currencyCode
    }

    totalAmount {
      amount
      currencyCode
    }
  }

  lines(first: 100) {
    nodes {
      id
      quantity

      cost {
        totalAmount {
          amount
          currencyCode
        }
      }

      merchandise {
        ... on ProductVariant {
          id
          title

          price {
            amount
            currencyCode
          }

          product {
            handle
            title

            featuredImage {
              url
              altText
            }
          }
        }
      }
    }
  }
`;

/* =========================================================
   NORMALIZE CART
========================================================= */

const normalizeCart = (cart) => ({
  id: cart.id,

  cartId: cart.id,

  checkoutUrl:
    cart.checkoutUrl,

  totalQuantity:
    cart.totalQuantity,

  subtotalPrice: Number(
    cart.cost?.subtotalAmount
      ?.amount || 0
  ),

  totalPrice: Number(
    cart.cost?.totalAmount?.amount ||
      cart.cost?.subtotalAmount
        ?.amount ||
      0
  ),

  merchandiseTotalPrice: (cart.lines?.nodes || []).reduce(
    (sum, line) => sum + Number(
      line.cost?.totalAmount?.amount ??
      Number(line.merchandise?.price?.amount || 0) * line.quantity
    ),
    0
  ),

  currencyCode:
    cart.cost?.totalAmount?.currencyCode ||
    cart.cost?.subtotalAmount?.currencyCode ||
    "INR",

  discountCodes: (cart.discountCodes || []).map((discount) => ({
    code: discount.code,
    applicable: discount.applicable,
  })),

  items: (
    cart.lines?.nodes || []
  ).map((line) => ({
    id: line.id,

    cartItemId: line.id,

    productId:
      line.merchandise?.product
        ?.handle,

    variantId:
      line.merchandise?.id,

    name:
      line.merchandise?.product
        ?.title,

    title:
      line.merchandise?.product
        ?.title,

    variantTitle:
      line.merchandise?.title,

    price: Number(
      line.cost?.totalAmount?.amount ??
      Number(line.merchandise?.price?.amount || 0) * line.quantity
    ) / (Number(line.quantity) || 1),

    lineTotal: Number(
      line.cost?.totalAmount?.amount ??
      Number(line.merchandise?.price?.amount || 0) * line.quantity
    ),

    quantity: line.quantity,

    qty: line.quantity,

    images:
      line.merchandise?.product
        ?.featuredImage?.url
        ? [
            line.merchandise.product
              .featuredImage.url,
          ]
        : [],
  })),
});

const isShopifyCartId = (cartId) =>
  typeof cartId === "string" &&
  /^gid:\/\/shopify\/Cart\/[^/\s]+$/.test(cartId.trim());

const logCartDiagnostics = (
  operation,
  cart,
  userErrors = [],
  graphQLErrors = []
) => {
  console.info(
    `[shopify][cart] ${JSON.stringify({
      operation,
      cartId: cart?.id || null,
      checkoutUrl: cart?.checkoutUrl || null,
      graphQLErrors: graphQLErrors.map((error) =>
        typeof error === "string" ? error : error?.message || String(error)
      ),
      userErrors: userErrors.map((error) => ({
        field: error?.field || null,
        code: error?.code || null,
        message: error?.message || String(error),
      })),
    })}`
  );
};

/* =========================================================
   FETCH CART
========================================================= */

const fetchCart = async (
  cartId
) => {
  if (!isShopifyCartId(cartId)) {
    const error = new Error("Cart ID is required and must be a valid Shopify Cart ID.");
    error.code = "INVALID_CART_ID";
    throw error;
  }

  const data =
    await storefrontGraphql(
      `query Cart($id: ID!) {
        cart(id: $id) {
          ${cartFields}
        }
      }`,
      {
        id: cartId,
      }
    );

  return data.cart
    ? normalizeCart(data.cart)
    : null;
};

/* =========================================================
   INVENTORY
========================================================= */

const validateCartInventory =
  async (cartId) => {
    const cart =
      await fetchCart(cartId);

    if (!cart) {
      return {
        cart: null,
        issues: [],
      };
    }

    const variantIds =
      cart.items.map(
        (item) => item.variantId
      );

    if (!variantIds.length) {
      return {
        cart,
        issues: [],
      };
    }

    const data =
      await adminGraphql(
        `query CartInventory($ids: [ID!]!) {
          nodes(ids: $ids) {
            ... on ProductVariant {
              id
              inventoryQuantity
            }
          }
        }`,
        {
          ids: variantIds,
        }
      );

    const inventoryById =
      new Map(
        (data.nodes || [])
          .filter(Boolean)
          .map((variant) => [
            variant.id,
            variant.inventoryQuantity === null
              ? null
              : Number(variant.inventoryQuantity),
          ])
      );

    const issues =
      cart.items.flatMap(
        (item) => {
          const available =
            inventoryById.get(
              item.variantId
            );

          if (available === undefined) {
            return [{
              variantId: item.variantId,
              requested: item.quantity,
              available: 0,
              reason: "VARIANT_UNAVAILABLE",
            }];
          }
          if (available === null || item.quantity <= available) {
            return [];
          }

          return [
            {
              variantId:
                item.variantId,

              requested:
                item.quantity,

              available,
            },
          ];
        }
      );

    return {
      cart,
      issues,
    };
  };

const getVariantInventory =
  async (variantId) => {
    const data =
      await adminGraphql(
        `query VariantInventory($id: ID!) {
          node(id: $id) {
            ... on ProductVariant {
              id
              inventoryQuantity
            }
          }
        }`,
        {
          id: variantId,
        }
      );

    const variant =
      data.node;

    return variant
      ? Number(
          variant.inventoryQuantity ??
            0
        )
      : null;
  };

const codOrderTag = (cartId) =>
  `dyva-cod-${crypto.createHash("sha256").update(String(cartId)).digest("hex").slice(0, 24)}`;

const orderFromAdmin = (order) => ({
  id: order.id,
  // Shopify assigns this numeric ID when the order is created; it matches the
  // final number in the Shopify Admin order URL.
  orderId: String(order.legacyResourceId || order.id?.split("/").pop() || ""),
  orderNumber: order.name,
  createdAt: order.createdAt || null,
  processedAt: order.processedAt || null,
  amount: order.currentTotalPriceSet?.shopMoney || null,
  originalAmount: order.originalTotalPriceSet?.shopMoney || null,
  originalSubtotal: order.subtotalPriceSet?.shopMoney || null,
  subtotal: order.subtotalPriceSet?.shopMoney || null,
  shipping: order.totalShippingPriceSet?.shopMoney || null,
  discount: order.totalDiscountsSet?.shopMoney || null,
  paymentStatus: order.displayFinancialStatus || "PENDING",
  fulfillmentStatus: order.displayFulfillmentStatus || "UNFULFILLED",
  cancelledAt: order.cancelledAt || null,
  paymentGatewayNames: order.paymentGatewayNames || [],
  customer: {
    firstName: order.customer?.firstName || order.shippingAddress?.firstName || "",
    lastName: order.customer?.lastName || order.shippingAddress?.lastName || "",
    email: order.email || "",
    phone: order.phone || "",
  },
  shippingAddress: order.shippingAddress || null,
  billingAddress: order.billingAddress || null,
  lineItems: order.lineItems || { nodes: [] },
  fulfillments: order.fulfillments || [],
});

const getCustomerOrderIdMap = async (customerAccessToken) => {
  const customer = await fetchCustomer(customerAccessToken);
  if (!customer) return { authenticated: false, ids: {} };
  const customerOrders = customer.orders?.nodes || [];
  if (!customerOrders.length) return { authenticated: true, ids: {} };
  const ids = {};
  for (let index = 0; index < customerOrders.length; index += 250) {
    const data = await adminGraphql(
      `query CustomerOrderIds($ids: [ID!]!) {
        nodes(ids: $ids) {
          ... on Order {
            id
            legacyResourceId
            cancelledAt
            originalTotalPriceSet { shopMoney { amount currencyCode } }
            subtotalPriceSet { shopMoney { amount currencyCode } }
            totalShippingPriceSet { shopMoney { amount currencyCode } }
            currentTotalPriceSet { shopMoney { amount currencyCode } }
            displayFinancialStatus
            displayFulfillmentStatus
            paymentGatewayNames
            fulfillments {
              trackingInfo {
                company
                number
                url
              }
            }
          }
        }
      }`,
      { ids: customerOrders.slice(index, index + 250).map((order) => order.id) }
    );
    Object.assign(ids, Object.fromEntries(
      (data.nodes || []).filter(Boolean).map((order) => [
        order.id,
        {
          orderId: String(order.legacyResourceId),
          cancelledAt: order.cancelledAt || null,
          originalAmount: order.originalTotalPriceSet?.shopMoney || null,
          originalSubtotal: order.subtotalPriceSet?.shopMoney || null,
          subtotal: order.subtotalPriceSet?.shopMoney || null,
          shipping: order.totalShippingPriceSet?.shopMoney || null,
          amount: order.currentTotalPriceSet?.shopMoney || null,
          paymentStatus: order.displayFinancialStatus || null,
          fulfillmentStatus: order.displayFulfillmentStatus || null,
          paymentGatewayNames: order.paymentGatewayNames || [],
          fulfillments: order.fulfillments || [],
        },
      ])
    ));
  }
  return { authenticated: true, ids };
};

const getCustomerOrder = async (customerAccessToken, orderId) => {
  const customer = await fetchCustomer(customerAccessToken);
  if (!customer) return { authenticated: false, order: null };

  const customerOrders = customer.orders?.nodes || [];
  const requestedId = String(orderId).replace(/^#/, "");
  let customerOrder = customerOrders.find((order) => order.id === orderId);
  if (!customerOrder && /^\d+$/.test(requestedId)) {
    const idMap = await getCustomerOrderIdMap(customerAccessToken);
    const gid = Object.entries(idMap.ids).find(([, order]) =>
      String(order?.orderId || order) === requestedId
    )?.[0];
    customerOrder = customerOrders.find((order) => order.id === gid);
  }
  if (!customerOrder && /^\d+$/.test(requestedId)) {
    // Draft orders completed as COD orders may not appear in the customer's
    // Storefront order connection unless Shopify linked the draft to them.
    // Look up by Admin Order ID, then verify ownership before returning details.
    const data = await adminGraphql(
      `query CustomerOrderDetailsById($id: ID!) {
        order(id: $id) {
          id
          legacyResourceId
          name
          createdAt
          processedAt
          email
          phone
          displayFinancialStatus
          displayFulfillmentStatus
          cancelledAt
          paymentGatewayNames
          currentTotalPriceSet { shopMoney { amount currencyCode } }
          originalTotalPriceSet { shopMoney { amount currencyCode } }
          subtotalPriceSet { shopMoney { amount currencyCode } }
          totalShippingPriceSet { shopMoney { amount currencyCode } }
          totalDiscountsSet { shopMoney { amount currencyCode } }
          customer { id firstName lastName email }
          shippingAddress { firstName lastName address1 address2 city province zip country phone }
          billingAddress { firstName lastName address1 address2 city province zip country phone }
          lineItems(first: 100) {
            nodes {
              title
              quantity
              image { url altText }
              originalUnitPriceSet { shopMoney { amount currencyCode } }
              discountedTotalSet { shopMoney { amount currencyCode } }
            }
          }
          fulfillments {
            status
            estimatedDeliveryAt
            trackingInfo { company number url }
          }
        }
      }`,
      { id: `gid://shopify/Order/${requestedId}` }
    );

    const adminOrder = data.order;
    const linkedCustomer = adminOrder?.customer?.id === customer.id;
    if (adminOrder && linkedCustomer) {
      return { authenticated: true, order: orderFromAdmin(adminOrder) };
    }

    return { authenticated: true, order: null };
  }
  if (!customerOrder) return { authenticated: true, order: null };
  // Storefront order IDs can include an access-key query suffix. Admin GraphQL
  // expects the canonical Order GID, so rebuild it from the verified numeric ID.
  const shopifyOrderId = /^\d+$/.test(requestedId)
    ? `gid://shopify/Order/${requestedId}`
    : customerOrder.id;

  const data = await adminGraphql(
    `query CodOrderDetails($id: ID!) {
      order(id: $id) {
        id
        legacyResourceId
        name
        createdAt
        processedAt
        email
        phone
        displayFinancialStatus
        displayFulfillmentStatus
        cancelledAt
        paymentGatewayNames
        currentTotalPriceSet { shopMoney { amount currencyCode } }
        originalTotalPriceSet { shopMoney { amount currencyCode } }
        subtotalPriceSet { shopMoney { amount currencyCode } }
        totalShippingPriceSet { shopMoney { amount currencyCode } }
        totalDiscountsSet { shopMoney { amount currencyCode } }
        customer { firstName lastName }
        shippingAddress {
          firstName lastName address1 address2 city province zip country phone
        }
        billingAddress {
          firstName lastName address1 address2 city province zip country phone
        }
        lineItems(first: 100) {
          nodes {
            title
            quantity
            image { url altText }
            originalUnitPriceSet { shopMoney { amount currencyCode } }
            discountedTotalSet { shopMoney { amount currencyCode } }
          }
        }
        fulfillments {
          status
          estimatedDeliveryAt
          trackingInfo { company number url }
        }
      }
    }`,
    { id: shopifyOrderId }
  );

  return { authenticated: true, order: data.order ? orderFromAdmin(data.order) : null };
};

const findCodOrder = async (tag) => {
  const data = await adminGraphql(
    `query CodOrderByTag($query: String!) {
      orders(first: 10, query: $query) {
        nodes {
        id
        legacyResourceId
        name
        email
        phone
        displayFinancialStatus
        currentTotalPriceSet {
          shopMoney {
            amount
            currencyCode
          }
        }
        originalTotalPriceSet { shopMoney { amount currencyCode } }
        shippingAddress {
          firstName
          lastName
          address1
          address2
          city
          province
          zip
          country
          phone
        }
        lineItems(first: 100) {
          nodes {
            title
            quantity
            originalUnitPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
          }
        }
        }
      }
    }`,
    { query: `tag:${tag}` }
  );
  return data.orders?.nodes?.[0] ? orderFromAdmin(data.orders.nodes[0]) : null;
};

const findCodDraft = async (tag) => {
  const data = await adminGraphql(
    `query CodDraftByTag($query: String!) {
      draftOrders(first: 10, query: $query) {
        nodes {
        id
        status
        }
      }
    }`,
    { query: `tag:${tag}` }
  );
  return data.draftOrders?.nodes?.find((draft) => draft.status === "OPEN") || null;
};

const createCodOrder = async ({ cartId, customer, shippingAddress }) => {
  console.info(`[COD][shopify] cartId: ${cartId || null}`);
  console.info(`[COD] phone received: ${customer?.phone ? `******${String(customer.phone).slice(-4)}` : null}`);
  if (!isShopifyCartId(cartId)) {
    console.info("[COD] cartId valid: false");
    const error = new Error("Cart ID is required for COD order creation");
    error.code = "INVALID_CART_ID";
    throw error;
  }
  console.info("[COD] cartId valid: true");

  const requestKey = codOrderTag(cartId);
  const existingRequest = codOrderRequests.get(requestKey);
  if (existingRequest) return existingRequest;

  const request = (async () => {
    const existingOrder = await findCodOrder(requestKey);
    if (existingOrder) return existingOrder;

    const inventory = await validateCartInventory(cartId);
    console.info(`[COD] cart response: ${inventory.cart ? "received" : "empty"}`);
    if (!inventory.cart) {
      const error = new Error("Shopify cart not found");
      error.code = "CART_NOT_FOUND";
      throw error;
    }
    if (!inventory.cart.items.length) {
      const error = new Error("Your Shopify cart is empty.");
      error.code = "EMPTY_CART";
      throw error;
    }
    if (inventory.issues.length) {
      const error = new Error("Some products are unavailable in the requested quantity.");
      error.code = "INVENTORY_UNAVAILABLE";
      error.issues = inventory.issues;
      throw error;
    }

    const address = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      address1: shippingAddress.address1,
      address2: shippingAddress.address2 || "",
      city: shippingAddress.city,
      province: shippingAddress.state,
      zip: shippingAddress.postalCode,
      country: shippingAddress.country || "IN",
      phone: customer.phone,
    };
    const lineItems = inventory.cart.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
    }));

    let draft = await findCodDraft(requestKey);
    if (!draft) {
      const draftData = await adminGraphql(
        `mutation CodDraftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder { id status }
          userErrors { field message }
        }
        }`,
        {
        input: {
          email: customer.email,
          phone: customer.phone,
          lineItems,
          shippingAddress: address,
          billingAddress: address,
          note: `Dyva COD order (${requestKey})`,
          tags: ["dyva-cod", requestKey],
          customAttributes: [
            { key: "dyva_cod_request", value: requestKey },
            ...(shippingAddress.alternativePhone
              ? [{ key: "alternative_phone", value: shippingAddress.alternativePhone }]
              : []),
          ],
        },
        }
      );
      const result = draftData.draftOrderCreate;
      if (result.userErrors?.length) {
        throw new Error(result.userErrors.map((error) => error.message).join(", "));
      }
      draft = result.draftOrder;
      console.info("[COD] draft order created:", draft?.id || "unknown");
    }

    const completed = await adminGraphql(
      `mutation CodDraftOrderComplete($id: ID!, $paymentPending: Boolean!) {
        draftOrderComplete(id: $id, paymentPending: $paymentPending) {
          draftOrder {
            id
            order {
              id
              legacyResourceId
              name
              email
              phone
              displayFinancialStatus
              currentTotalPriceSet {
                shopMoney { amount currencyCode }
              }
              originalTotalPriceSet { shopMoney { amount currencyCode } }
              shippingAddress {
                firstName
                lastName
                address1
                address2
                city
                province
                zip
                country
                phone
              }
              lineItems(first: 100) {
                nodes {
                  title
                  quantity
                  originalUnitPriceSet { shopMoney { amount currencyCode } }
                }
              }
            }
          }
          userErrors { field message }
        }
      }`,
      { id: draft.id, paymentPending: true }
    );
    const result = completed.draftOrderComplete;
    if (result.userErrors?.length) {
      throw new Error(result.userErrors.map((error) => error.message).join(", "));
    }
    console.info("[COD] draft order completed:", result.draftOrder?.id || draft.id);
    if (!result.draftOrder?.order) throw new Error("Shopify did not return the created COD order.");
    const order = orderFromAdmin(result.draftOrder.order);
    console.info("[COD] final Shopify order ID:", order.id || "unknown");
    return order;
  })();

  codOrderRequests.set(requestKey, request);
  try {
    return await request;
  } finally {
    codOrderRequests.delete(requestKey);
  }
};

/* =========================================================
   CUSTOMER TOKEN
========================================================= */

const validateCustomerAccessToken =
  async (
    customerAccessToken
  ) => {
    if (!customerAccessToken) {
      return false;
    }

    const data =
      await storefrontGraphql(
        `query Customer($customerAccessToken: String!) {
          customer(
            customerAccessToken:
              $customerAccessToken
          ) {
            id
          }
        }`,
        {
          customerAccessToken,
        }
      );

    return Boolean(
      data.customer
    );
  };

/* =========================================================
   CART DELIVERY ADDRESS
========================================================= */

const updateCartDeliveryAddress =
  async (
    cartId,
    address
  ) => {
    const data =
      await storefrontGraphql(
        `mutation CartDeliveryAddressesAdd(
          $cartId: ID!
          $addresses: [CartSelectableAddressInput!]!
        ) {
          cartDeliveryAddressesAdd(
            cartId: $cartId
            addresses: $addresses
          ) {
            cart {
              ${cartFields}
            }

            userErrors {
              field
              message
            }
          }
        }`,
        {
          cartId,

          addresses: [
            {
              selected: true,

              oneTimeUse: true,

              address: {
                deliveryAddress: {
                  address1:
                    address.address1,

                  address2:
                    address.address2 ||
                    undefined,

                  city:
                    address.city,

                  countryCode:
                    "IN",

                  firstName:
                    address.name,

                  phone:
                    address.phone,

                  provinceCode:
                    address.state,

                  zip:
                    address.pincode,
                },
              },
            },
          ],
        }
      );

    const result =
      data.cartDeliveryAddressesAdd;

    const errors =
      result.userErrors || [];

    logCartDiagnostics(
      "cartDeliveryAddressesAdd",
      result.cart,
      errors
    );

    if (errors.length) {
      throw new Error(
        errors
          .map(
            (error) =>
              error.message
          )
          .join(", ")
      );
    }

    return normalizeCart(
      result.cart
    );
  };

/* =========================================================
   CART BUYER IDENTITY
========================================================= */

const updateCartBuyerIdentity =
  async (
    cartId,
    customerAccessToken
  ) => {
    const data =
      await storefrontGraphql(
        `mutation CartBuyerIdentityUpdate(
          $cartId: ID!
          $buyerIdentity: CartBuyerIdentityInput!
        ) {
          cartBuyerIdentityUpdate(
            cartId: $cartId
            buyerIdentity: $buyerIdentity
          ) {
            cart {
              ${cartFields}
            }

            userErrors {
              field
              message
            }
          }
        }`,
        {
          cartId,

          buyerIdentity: {
            customerAccessToken,

            countryCode: "IN",
          },
        }
      );

    const result =
      data.cartBuyerIdentityUpdate;

    const errors =
      result.userErrors || [];

    logCartDiagnostics(
      "cartBuyerIdentityUpdate",
      result.cart,
      errors
    );

    if (errors.length) {
      throw new Error(
        errors
          .map(
            (error) =>
              error.message
          )
          .join(", ")
      );
    }

    return normalizeCart(
      result.cart
    );
  };

/* =========================================================
   CREATE CART
========================================================= */

const createCart = async (
  lines
) => {
  const data = await storefrontGraphql(
      `mutation CartCreate(
        $input: CartInput!
      ) {
        cartCreate(
          input: $input
        ) {
          cart {
            ${cartFields}
          }

          userErrors {
            field
            message
          }
        }
      }`,
      {
        input: {
          lines,
        },
      }
    );

  const errors =
    data.cartCreate
      .userErrors || [];

  logCartDiagnostics(
    "cartCreate",
    data.cartCreate?.cart,
    errors
  );

  if (errors.length) {
    throw new Error(
      errors
        .map(
          (error) =>
            error.message
        )
        .join(", ")
    );
  }

  return normalizeCart(
    data.cartCreate.cart
  );
};

/* =========================================================
   GENERIC CART MUTATION
========================================================= */

const mutateCart = async (
  mutation,
  variables,
  field
) => {
  const data = await storefrontGraphql(
    mutation,
    variables
  );

  const result =
    data[field];

  const errors =
    result.userErrors || [];

  logCartDiagnostics(field, result.cart, errors);

  if (errors.length) {
    throw new Error(
      errors
        .map(
          (error) =>
            error.message
        )
        .join(", ")
    );
  }

  return normalizeCart(
    result.cart
  );
};

/* =========================================================
   ADD CART LINES
========================================================= */

const addCartLines = (
  cartId,
  lines
) =>
  mutateCart(
    `mutation CartLinesAdd(
      $cartId: ID!
      $lines: [CartLineInput!]!
    ) {
      cartLinesAdd(
        cartId: $cartId
        lines: $lines
      ) {
        cart {
          ${cartFields}
        }

        userErrors {
          field
          message
        }
      }
    }`,
    {
      cartId,
      lines,
    },
    "cartLinesAdd"
  );

/* =========================================================
   UPDATE CART DISCOUNT CODES
========================================================= */

const updateCartDiscountCodes = (cartId, discountCodes) =>
  mutateCart(
    `mutation CartDiscountCodesUpdate(
      $cartId: ID!
      $discountCodes: [String!]!
    ) {
      cartDiscountCodesUpdate(
        cartId: $cartId
        discountCodes: $discountCodes
      ) {
        cart {
          ${cartFields}
        }
        userErrors {
          field
          message
        }
        warnings {
          code
          message
        }
      }
    }`,
    { cartId, discountCodes },
    "cartDiscountCodesUpdate"
  );

/* =========================================================
   UPDATE CART LINES
========================================================= */

const updateCartLines = (
  cartId,
  lines
) =>
  mutateCart(
    `mutation CartLinesUpdate(
      $cartId: ID!
      $lines: [CartLineUpdateInput!]!
    ) {
      cartLinesUpdate(
        cartId: $cartId
        lines: $lines
      ) {
        cart {
          ${cartFields}
        }

        userErrors {
          field
          message
        }
      }
    }`,
    {
      cartId,
      lines,
    },
    "cartLinesUpdate"
  );

/* =========================================================
   REMOVE CART LINES
========================================================= */

const removeCartLines = (
  cartId,
  lineIds
) =>
  mutateCart(
    `mutation CartLinesRemove(
      $cartId: ID!
      $lineIds: [ID!]!
    ) {
      cartLinesRemove(
        cartId: $cartId
        lineIds: $lineIds
      ) {
        cart {
          ${cartFields}
        }

        userErrors {
          field
          message
        }
      }
    }`,
    {
      cartId,
      lineIds,
    },
    "cartLinesRemove"
  );

/* =========================================================
   CUSTOMER REGISTER
========================================================= */

const registerCustomer =
  async ({
    firstName,
    lastName,
    email,
    password,
    phone,
  }) => {
    const data =
      await storefrontGraphql(
        `mutation CustomerCreate(
          $input: CustomerCreateInput!
        ) {
          customerCreate(
            input: $input
          ) {
            customer {
              id
              email
              firstName
              lastName
            }

            customerUserErrors {
              field
              message
              code
            }
          }
        }`,
        {
          input: {
            firstName,
            lastName,
            email,
            password,
            phone,
          },
        }
      );

    return data.customerCreate;
  };

/* =========================================================
   CUSTOMER LOGIN
========================================================= */

const loginCustomer =
  async ({
    email,
    password,
  }) => {
    const data =
      await storefrontGraphql(
        `mutation CustomerAccessTokenCreate(
          $input: CustomerAccessTokenCreateInput!
        ) {
          customerAccessTokenCreate(
            input: $input
          ) {
            customerAccessToken {
              accessToken
              expiresAt
            }

            customerUserErrors {
              field
              message
              code
            }
          }
        }`,
        {
          input: {
            email,
            password,
          },
        }
      );

    return data.customerAccessTokenCreate;
  };


const findCustomerByEmail = async (email) => {
  const data = await adminGraphql(
    `query CustomerByEmail($query: String!) {
      customers(first: 2, query: $query) { nodes { id email firstName lastName } }
    }`,
    { query: `email:${String(email).replace(/["\\]/g, "")}` }
  );
  return (data.customers?.nodes || []).find((customer) => String(customer.email || "").toLowerCase() === String(email).toLowerCase()) || null;
};

/* =========================================================
   CUSTOMER FIELDS
========================================================= */

const customerFields = `
  id
  email
  firstName
  lastName
  phone

  defaultAddress {
    id
    address1
    address2
    city
    province
    zip
    country
    phone
    firstName
    lastName
  }

  addresses(first: 20) {
    nodes {
      id
      address1
      address2
      city
      province
      zip
      country
      phone
      firstName
      lastName
    }
  }

  orders(
    first: 50
    sortKey: PROCESSED_AT
    reverse: true
  ) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      orderNumber
      processedAt

      currentTotalPrice {
        amount
        currencyCode
      }

      financialStatus
      fulfillmentStatus

      lineItems(first: 10) {
        nodes {
          title
          quantity
          variant { image { url altText } }
        }
      }
    }
  }
`;

/* =========================================================
   FETCH CUSTOMER
========================================================= */

const fetchCustomer =
  async (
    customerAccessToken
  ) => {
    const data =
      await storefrontGraphql(
        `query CustomerDetails(
          $customerAccessToken: String!
        ) {
          customer(
            customerAccessToken:
              $customerAccessToken
          ) {
            ${customerFields}
          }
        }`,
        {
          customerAccessToken,
        }
      );

    const customer = data.customer;
    if (!customer?.orders?.pageInfo?.hasNextPage) return customer;

    const allOrders = [...(customer.orders.nodes || [])];
    let cursor = customer.orders.pageInfo.endCursor;
    let hasNextPage = customer.orders.pageInfo.hasNextPage;
    while (hasNextPage && cursor) {
      const nextPage = await storefrontGraphql(
        `query CustomerOrderHistoryPage($customerAccessToken: String!, $cursor: String) {
          customer(customerAccessToken: $customerAccessToken) {
            orders(first: 50, after: $cursor, sortKey: PROCESSED_AT, reverse: true) {
              pageInfo { hasNextPage endCursor }
              nodes {
                id
                orderNumber
                processedAt
                currentTotalPrice { amount currencyCode }
                financialStatus
                fulfillmentStatus
                lineItems(first: 10) {
                  nodes { title quantity variant { image { url altText } } }
                }
              }
            }
          }
        }`,
        { customerAccessToken, cursor }
      );
      const connection = nextPage.customer?.orders;
      allOrders.push(...(connection?.nodes || []));
      cursor = connection?.pageInfo?.endCursor;
      hasNextPage = Boolean(connection?.pageInfo?.hasNextPage);
    }
    customer.orders.nodes = allOrders;
    return customer;
  };

const findOrderByTrackingId = async (trackingId) => {
  const normalizedTrackingId = String(trackingId || "").trim();
  if (!normalizedTrackingId) return null;
  const orderNumber = normalizedTrackingId.replace(/^#/, "");
  const searchQuery = /^\d+$/.test(orderNumber)
    ? `id:${orderNumber}`
    : `fulfillment_tracking_number:${normalizedTrackingId}`;

  const data = await adminGraphql(
    `query OrderByTrackingId($query: String!) {
      orders(first: 10, query: $query) {
        nodes {
          id
          legacyResourceId
          name
          processedAt
          currentTotalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          displayFinancialStatus
          displayFulfillmentStatus
          cancelledAt
          lineItems(first: 10) {
            nodes {
              title
              quantity
            }
          }
          fulfillments {
            status
            trackingInfo {
              company
              number
              url
            }
          }
        }
      }
    }`,
    { query: searchQuery }
  );

  let order = /^\d+$/.test(orderNumber)
    ? data.orders.nodes.find((candidate) => String(candidate.legacyResourceId) === orderNumber)
    : null;
  if (!order) order = data.orders.nodes.find((candidate) =>
        candidate.fulfillments?.some((fulfillment) =>
          fulfillment.trackingInfo?.some((tracking) => tracking.number === normalizedTrackingId)
        )
      );
  if (!order) return null;

  return {
    id: order.id,
    legacyResourceId: String(order.legacyResourceId),
    orderNumber: order.name,
    processedAt: order.processedAt,
    currentTotalPrice: order.currentTotalPriceSet?.shopMoney,
    financialStatus: order.displayFinancialStatus,
    fulfillmentStatus: order.displayFulfillmentStatus,
    cancelledAt: order.cancelledAt || null,
    lineItems: order.lineItems,
    fulfillments: order.fulfillments,
  };
};

/* =========================================================
   UPDATE CUSTOMER
========================================================= */

const updateCustomer =
  async (
    customerAccessToken,
    input
  ) => {
    const data =
      await storefrontGraphql(
        `mutation CustomerUpdate(
          $customerAccessToken: String!
          $customer: CustomerUpdateInput!
        ) {
          customerUpdate(
            customerAccessToken:
              $customerAccessToken

            customer: $customer
          ) {
            customer {
              ${customerFields}
            }

            customerUserErrors {
              field
              message
              code
            }
          }
        }`,
        {
          customerAccessToken,

          customer: input,
        }
      );

    const result =
      data.customerUpdate;

    const errors =
      result.customerUserErrors ||
      [];

    if (errors.length) {
      throw new Error(
        errors
          .map(
            (error) =>
              error.message
          )
          .join(", ")
      );
    }

    return result.customer;
  };

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
  checkShopifyConnection:
    async () => {
      const result =
        await fetchProducts({
          first: 1,
        });

      return (
        result.products.length > 0 ||
        result.total === 0
      );
    },

  fetchProducts,

  fetchProduct,

  fetchStorefrontContent,

  fetchStorePolicies,

  fetchAllStorePolicies,

  fetchCart,

  isShopifyCartId,

  validateCartInventory,

  getVariantInventory,

  createCodOrder,

  getCustomerOrder,

  getCustomerOrderIdMap,

  validateCustomerAccessToken,

  updateCartDeliveryAddress,

  updateCartBuyerIdentity,

  createCart,

  addCartLines,
  updateCartDiscountCodes,

  updateCartLines,

  removeCartLines,

  registerCustomer,

  loginCustomer,
  findCustomerByEmail,

  fetchCustomer,

  findOrderByTrackingId,

  updateCustomer,

  normalizeProduct,

  getAdminToken,
};
