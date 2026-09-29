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
  process.env.SHOPIFY_CONCERN_TYPE || "app--428015452161--dyva_concern";

const SHOPIFY_EXCLUDED_PRODUCT_HANDLES = new Set(
  (process.env.SHOPIFY_EXCLUDED_PRODUCT_HANDLES || "")
    .split(",")
    .map((handle) => handle.trim())
    .filter(Boolean)
);

let adminTokenPromise;

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

  if (!response.ok || payload.errors?.length) {
    const graphQLErrors = payload.errors || [];

    if (graphQLErrors.length) {
      const apiName = new URL(url).pathname.includes("/admin/")
        ? "Admin"
        : "Storefront";

      console.error(
        `[shopify] ${apiName} GraphQL error:`,
        JSON.stringify(
          graphQLErrors.map(
            ({ message, path, extensions }) => ({
              message,
              path,
              extensions,
            })
          )
        )
      );
    }

    const messages = graphQLErrors
      .map((error) => error.message)
      .filter(Boolean)
      .join(", ");

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

  return requestGraphql(
    storefrontUrl(),
    {
      "X-Shopify-Storefront-Access-Token":
        SHOPIFY_STOREFRONT_TOKEN,
    },
    query,
    variables
  );
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

const fetchStorefrontContent =
  async () => {
    if (
      storefrontContentCache.value &&
      storefrontContentCache.expiresAt >
        Date.now()
    ) {
      return storefrontContentCache.value;
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
            SHOPIFY_CONCERN_TYPE,
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
      line.merchandise?.price
        ?.amount || 0
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

/* =========================================================
   FETCH CART
========================================================= */

const fetchCart = async (
  cartId
) => {
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
          .map(
            (variant) => [
              variant.id,
              Number(
                variant.inventoryQuantity ??
                  0
              ),
            ]
          )
      );

    const issues =
      cart.items.flatMap(
        (item) => {
          const available =
            inventoryById.get(
              item.variantId
            );

          if (
            available === undefined ||
            item.quantity <=
              available
          ) {
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
  const data =
    await storefrontGraphql(
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
  const data =
    await storefrontGraphql(
      mutation,
      variables
    );

  const result =
    data[field];

  const errors =
    result.userErrors || [];

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

/* =========================================================
   CUSTOMER RECOVER
========================================================= */

const recoverCustomer =
  async (email) => {
    const data =
      await storefrontGraphql(
        `mutation CustomerRecover(
          $email: String!
        ) {
          customerRecover(
            email: $email
          ) {
            customerUserErrors {
              field
              message
              code
            }
          }
        }`,
        {
          email,
        }
      );

    return data.customerRecover;
  };

/* =========================================================
   CUSTOMER RESET
========================================================= */

const resetCustomerByUrl =
  async ({
    resetUrl,
    password,
  }) => {
    const data =
      await storefrontGraphql(
        `mutation CustomerResetByUrl(
          $resetUrl: URL!
          $password: String!
        ) {
          customerResetByUrl(
            resetUrl: $resetUrl
            password: $password
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
          resetUrl,
          password,
        }
      );

    return data.customerResetByUrl;
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
    first: 20
    sortKey: PROCESSED_AT
    reverse: true
  ) {
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

    return data.customer;
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

  fetchCart,

  validateCartInventory,

  getVariantInventory,

  validateCustomerAccessToken,

  updateCartDeliveryAddress,

  updateCartBuyerIdentity,

  createCart,

  addCartLines,

  updateCartLines,

  removeCartLines,

  registerCustomer,

  loginCustomer,

  recoverCustomer,

  resetCustomerByUrl,

  fetchCustomer,

  updateCustomer,

  normalizeProduct,

  getAdminToken,
};
