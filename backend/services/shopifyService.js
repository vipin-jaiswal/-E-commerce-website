const SHOPIFY_STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || "2026-07";
const SHOPIFY_PRODUCT_QUERY = process.env.SHOPIFY_PRODUCT_QUERY || "status:active";
const SHOPIFY_EXCLUDED_PRODUCT_HANDLES = new Set(
  (process.env.SHOPIFY_EXCLUDED_PRODUCT_HANDLES || "")
    .split(",")
    .map((handle) => handle.trim())
    .filter(Boolean)
);

let adminTokenPromise;

const normalizeShopDomain = (value) =>
  String(value || "")
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

const shopDomain = normalizeShopDomain(SHOPIFY_STORE_DOMAIN);

const requestGraphql = async (url, headers, query, variables = {}) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ query, variables }),
  });

  const text = await response.text();
  let payload;

  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error(`Shopify returned a non-JSON response (HTTP ${response.status})`);
  }

  if (!response.ok || payload.errors?.length) {
    const messages = payload.errors?.map((error) => error.message).join(", ");
    throw new Error(messages || `Shopify API request failed (HTTP ${response.status})`);
  }

  return payload.data;
};

const requireShopDomain = () => {
  if (!shopDomain) throw new Error("SHOPIFY_STORE_DOMAIN is missing");
  return shopDomain;
};

const storefrontUrl = () =>
  `https://${requireShopDomain()}/api/${SHOPIFY_API_VERSION}/graphql.json`;

const adminUrl = () =>
  `https://${requireShopDomain()}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;

const getAdminToken = async () => {
  if (process.env.SHOPIFY_ADMIN_TOKEN) return process.env.SHOPIFY_ADMIN_TOKEN;
  if (adminTokenPromise) return adminTokenPromise;

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Shopify Admin credentials are missing");
  }

  adminTokenPromise = fetch(`https://${requireShopDomain()}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })
    .then(async (response) => {
      const text = await response.text();
      let payload;
      try {
        payload = JSON.parse(text);
      } catch {
        throw new Error(`Shopify token endpoint returned non-JSON (HTTP ${response.status})`);
      }
      if (!response.ok || !payload.access_token) {
        throw new Error(payload.error_description || `Shopify token request failed (HTTP ${response.status})`);
      }
      return payload.access_token;
    })
    .catch((error) => {
      adminTokenPromise = undefined;
      throw error;
    });

  return adminTokenPromise;
};

const adminGraphql = async (query, variables) =>
  requestGraphql(adminUrl(), { "X-Shopify-Access-Token": await getAdminToken() }, query, variables);

const storefrontGraphql = async (query, variables) => {
  if (!SHOPIFY_STOREFRONT_TOKEN) {
    throw new Error("SHOPIFY_STOREFRONT_TOKEN is missing");
  }
  return requestGraphql(
    storefrontUrl(),
    { "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN },
    query,
    variables
  );
};

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
  featuredImage { url altText }
  images(first: 20) { nodes { url altText } }
  variants(first: 50) {
    nodes {
      id
      title
      availableForSale
      price { amount currencyCode }
      compareAtPrice { amount currencyCode }
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
  featuredImage { url altText }
  images(first: 20) { nodes { url altText } }
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

const moneyAmount = (value) =>
  typeof value === "object" ? value?.amount : value;

const normalizeProduct = (product) => {
  const variants = product.variants?.nodes || [];
  const firstVariant = variants[0];
  const images = product.images?.nodes?.map((image) => image.url).filter(Boolean) || [];
  const hasAvailableVariant = variants.some((variant) => variant.availableForSale === true);
  const isAvailable = variants.length
    ? hasAvailableVariant
    : Boolean(product.availableForSale ?? product.status === "ACTIVE");
  const normalizedVariants = variants.map((variant) => ({
    id: variant.id,
    title: variant.title,
    price: Number(moneyAmount(variant.price) || 0),
    compareAtPrice: variant.compareAtPrice
      ? Number(moneyAmount(variant.compareAtPrice) || 0)
      : null,
    availableForSale: variant.availableForSale === true,
    quantityAvailable: variant.quantityAvailable ?? variant.inventoryQuantity,
  }));

  if (process.env.NODE_ENV !== "production") {
    console.debug("[shopify] normalized product inventory", {
      id: product.id,
      title: product.title,
      variants: normalizedVariants.map(({ id, title, availableForSale, quantityAvailable }) => ({
        id,
        title,
        availableForSale,
        quantityAvailable,
      })),
    });
  }

  return {
    id: product.handle,
    shopifyId: product.id,
    handle: product.handle,
    name: product.title,
    title: product.title,
    description: product.description || product.descriptionHtml || "",
    brand: product.vendor || "",
    category: product.productType || "",
    categories: product.productType ? [product.productType] : [],
    images: images.length ? images : product.featuredImage?.url ? [product.featuredImage.url] : [],
    price: Number(moneyAmount(firstVariant?.price) || 0),
    salePrice: firstVariant?.compareAtPrice
      ? Number(moneyAmount(firstVariant.compareAtPrice) || 0)
      : null,
    stock: normalizedVariants.reduce((total, variant) => total + Number(variant.quantityAvailable ?? 0), 0),
    availableForSale: Boolean(isAvailable),
    comingSoon: !isAvailable,
    variants: normalizedVariants,
    weights: variants.map((variant) => variant.title).filter((title) => title && title !== "Default Title"),
  };
};

const fetchProducts = async ({ first = 24, query = "" } = {}) => {
  const useStorefront = Boolean(SHOPIFY_STOREFRONT_TOKEN);
  const graphql = useStorefront ? storefrontGraphql : adminGraphql;
  const fields = useStorefront ? storefrontProductFields : adminProductFields;
  const productQuery = [SHOPIFY_PRODUCT_QUERY, query].filter(Boolean).join(" ");
  const data = await graphql(
    `query Products($first: Int!, $query: String) {
      products(first: $first, query: $query) {
        nodes { ${fields} }
      }
    }`,
    { first, query: productQuery || null }
  );
  return {
    products: data.products.nodes
      .filter((product) => !SHOPIFY_EXCLUDED_PRODUCT_HANDLES.has(product.handle))
      .map(normalizeProduct),
    total: data.products.nodes.filter(
      (product) => !SHOPIFY_EXCLUDED_PRODUCT_HANDLES.has(product.handle)
    ).length,
  };
};

const fetchProduct = async (handle) => {
  const useStorefront = Boolean(SHOPIFY_STOREFRONT_TOKEN);
  if (useStorefront) {
    const data = await storefrontGraphql(
      `query Product($handle: String!) {
        product(handle: $handle) { ${storefrontProductFields} }
      }`,
      { handle }
    );
    return data.product ? normalizeProduct(data.product) : null;
  }

  const data = await adminGraphql(
    `query ProductByHandle($query: String!) {
      products(first: 1, query: $query) { nodes { ${adminProductFields} } }
    }`,
    { query: `handle:${handle}` }
  );
  const product = data.products.nodes[0];
  return product && !SHOPIFY_EXCLUDED_PRODUCT_HANDLES.has(product.handle)
    ? normalizeProduct(product)
    : null;
};

const cartFields = `
  id
  checkoutUrl
  totalQuantity
  cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } }
  lines(first: 100) {
    nodes {
      id
      quantity
      merchandise {
        ... on ProductVariant {
          id
          title
          price { amount currencyCode }
          product { handle title featuredImage { url altText } }
        }
      }
    }
  }
`;

const normalizeCart = (cart) => ({
  id: cart.id,
  cartId: cart.id,
  checkoutUrl: cart.checkoutUrl,
  totalQuantity: cart.totalQuantity,
  subtotalPrice: Number(cart.cost?.subtotalAmount?.amount || 0),
  totalPrice: Number(cart.cost?.totalAmount?.amount || cart.cost?.subtotalAmount?.amount || 0),
  items: (cart.lines?.nodes || []).map((line) => ({
    id: line.id,
    cartItemId: line.id,
    productId: line.merchandise.product.handle,
    variantId: line.merchandise.id,
    name: line.merchandise.product.title,
    title: line.merchandise.product.title,
    variantTitle: line.merchandise.title,
    price: Number(line.merchandise.price?.amount || 0),
    quantity: line.quantity,
    qty: line.quantity,
    images: line.merchandise.product.featuredImage?.url
      ? [line.merchandise.product.featuredImage.url]
      : [],
  })),
});

const fetchCart = async (cartId) => {
  const data = await storefrontGraphql(
    `query Cart($id: ID!) { cart(id: $id) { ${cartFields} } }`,
    { id: cartId }
  );
  return data.cart ? normalizeCart(data.cart) : null;
};

const validateCartInventory = async (cartId) => {
  const cart = await fetchCart(cartId);
  if (!cart) return { cart: null, issues: [] };

  const variantIds = cart.items.map((item) => item.variantId);
  const data = await adminGraphql(
    `query CartInventory($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on ProductVariant { id inventoryQuantity }
      }
    }`,
    { ids: variantIds }
  );

  const inventoryById = new Map(
    data.nodes.filter(Boolean).map((variant) => [variant.id, Number(variant.inventoryQuantity ?? 0)])
  );
  const issues = cart.items.flatMap((item) => {
    const available = inventoryById.get(item.variantId);
    if (available === undefined || item.quantity <= available) return [];
    return [{ variantId: item.variantId, requested: item.quantity, available }];
  });

  return { cart, issues };
};

const getVariantInventory = async (variantId) => {
  const data = await adminGraphql(
    `query VariantInventory($id: ID!) {
      node(id: $id) { ... on ProductVariant { id inventoryQuantity } }
    }`,
    { id: variantId }
  );
  const variant = data.node;
  return variant ? Number(variant.inventoryQuantity ?? 0) : null;
};

const validateCustomerAccessToken = async (customerAccessToken) => {
  if (!customerAccessToken) return false;
  const data = await storefrontGraphql(
    `query Customer($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) { id }
    }`,
    { customerAccessToken }
  );
  return Boolean(data.customer);
};

const updateCartDeliveryAddress = async (cartId, address) => {
  const data = await storefrontGraphql(
    `mutation CartDeliveryAddressesUpdate($cartId: ID!, $addresses: [CartDeliveryAddressInput!]!) {
      cartDeliveryAddressesUpdate(cartId: $cartId, addresses: $addresses) {
        cart { ${cartFields} }
        userErrors { field message }
      }
    }`,
    {
      cartId,
      addresses: [{
        address1: address.address1,
        address2: address.address2 || undefined,
        city: address.city,
        countryCode: "IN",
        firstName: address.name,
        phone: address.phone,
        province: address.state,
        zip: address.pincode,
      }],
    }
  );
  const result = data.cartDeliveryAddressesUpdate;
  const errors = result.userErrors || [];
  if (errors.length) throw new Error(errors.map((error) => error.message).join(", "));
  return normalizeCart(result.cart);
};

const updateCartBuyerIdentity = async (cartId, customerAccessToken) => {
  const data = await storefrontGraphql(
    `mutation CartBuyerIdentityUpdate($cartId: ID!, $buyerIdentity: CartBuyerIdentityInput!) {
      cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
        cart { ${cartFields} }
        userErrors { field message }
      }
    }`,
    { cartId, buyerIdentity: { customerAccessToken, countryCode: "IN" } }
  );
  const result = data.cartBuyerIdentityUpdate;
  const errors = result.userErrors || [];
  if (errors.length) throw new Error(errors.map((error) => error.message).join(", "));
  return normalizeCart(result.cart);
};

const createCart = async (lines) => {
  const data = await storefrontGraphql(
    `mutation CartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart { ${cartFields} }
        userErrors { field message }
      }
    }`,
    { input: { lines } }
  );
  const errors = data.cartCreate.userErrors || [];
  if (errors.length) throw new Error(errors.map((error) => error.message).join(", "));
  return normalizeCart(data.cartCreate.cart);
};

const mutateCart = async (mutation, variables, field) => {
  const data = await storefrontGraphql(mutation, variables);
  const result = data[field];
  const errors = result.userErrors || [];
  if (errors.length) throw new Error(errors.map((error) => error.message).join(", "));
  return normalizeCart(result.cart);
};

const addCartLines = (cartId, lines) => mutateCart(
  `mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${cartFields} } userErrors { field message } }
  }`,
  { cartId, lines },
  "cartLinesAdd"
);

const updateCartLines = (cartId, lines) => mutateCart(
  `mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${cartFields} } userErrors { field message } }
  }`,
  { cartId, lines },
  "cartLinesUpdate"
);

const removeCartLines = (cartId, lineIds) => mutateCart(
  `mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ${cartFields} } userErrors { field message } }
  }`,
  { cartId, lineIds },
  "cartLinesRemove"
);

const registerCustomer = async ({ firstName, lastName, email, password }) => {
  const data = await storefrontGraphql(
    `mutation CustomerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id email firstName lastName }
        customerUserErrors { field message code }
      }
    }`,
    { input: { firstName, lastName, email, password } }
  );
  return data.customerCreate;
};

const loginCustomer = async ({ email, password }) => {
  const data = await storefrontGraphql(
    `mutation CustomerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
      customerAccessTokenCreate(input: $input) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { field message code }
      }
    }`,
    { input: { email, password } }
  );
  return data.customerAccessTokenCreate;
};

const recoverCustomer = async (email) => {
  const data = await storefrontGraphql(
    `mutation CustomerRecover($email: String!) {
      customerRecover(email: $email) {
        customerUserErrors { field message code }
      }
    }`,
    { email }
  );
  return data.customerRecover;
};

const resetCustomerByUrl = async ({ resetUrl, password }) => {
  const data = await storefrontGraphql(
    `mutation CustomerResetByUrl($resetUrl: URL!, $password: String!) {
      customerResetByUrl(resetUrl: $resetUrl, password: $password) {
        customerAccessToken { accessToken expiresAt }
        customerUserErrors { field message code }
      }
    }`,
    { resetUrl, password }
  );
  return data.customerResetByUrl;
};

const customerFields = `
  id
  email
  firstName
  lastName
  phone
  defaultAddress { id address1 address2 city province zip country phone firstName lastName }
  addresses(first: 20) { nodes { id address1 address2 city province zip country phone firstName lastName } }
  orders(first: 20, sortKey: PROCESSED_AT, reverse: true) {
    nodes {
      id
      orderNumber
      processedAt
      currentTotalPrice { amount currencyCode }
      financialStatus
      fulfillmentStatus
      lineItems(first: 10) { nodes { title quantity } }
    }
  }
`;

const fetchCustomer = async (customerAccessToken) => {
  const data = await storefrontGraphql(
    `query CustomerDetails($customerAccessToken: String!) {
      customer(customerAccessToken: $customerAccessToken) { ${customerFields} }
    }`,
    { customerAccessToken }
  );
  return data.customer;
};

const updateCustomer = async (customerAccessToken, input) => {
  const data = await storefrontGraphql(
    `mutation CustomerUpdate($customerAccessToken: String!, $customer: CustomerUpdateInput!) {
      customerUpdate(customerAccessToken: $customerAccessToken, customer: $customer) {
        customer { ${customerFields} }
        customerUserErrors { field message code }
      }
    }`,
    { customerAccessToken, customer: input }
  );
  const result = data.customerUpdate;
  const errors = result.customerUserErrors || [];
  if (errors.length) throw new Error(errors.map((error) => error.message).join(", "));
  return result.customer;
};

const fetchAdminOverview = async () => {
  const readCount = async (field, argumentsText = "limit: 1") => {
    try {
      const data = await adminGraphql(`query AdminCount { count: ${field}(${argumentsText}) { count } }`);
      return Number(data.count?.count || 0);
    } catch (error) {
      if (error.message?.includes("Access denied")) return null;
      throw error;
    }
  };
  const [totalProducts, totalOrders, pendingOrders, customers] = await Promise.all([
    readCount("productsCount"),
    readCount("ordersCount"),
    readCount("ordersCount", 'query: "status:open", limit: 1'),
    readCount("customersCount"),
  ]);
  return {
    totalProducts,
    totalOrders,
    pendingOrders,
    customers,
  };
};

const fetchAdminCollection = async (type) => {
  const fields = type === "orders"
    ? `id name createdAt displayFinancialStatus displayFulfillmentStatus totalPriceSet { shopMoney { amount currencyCode } } customer { id displayName email }`
    : `id displayName email phone createdAt`;
  const data = await adminGraphql(
    `query AdminCollection($first: Int!) { ${type}(first: $first, sortKey: CREATED_AT, reverse: true) { nodes { ${fields} } } }`,
    { first: 100 }
  );
  return data[type].nodes;
};

module.exports = {
  checkShopifyConnection: async () => {
    const result = await fetchProducts({ first: 1 });
    return result.products.length > 0 || result.total === 0;
  },
  fetchProducts,
  fetchProduct,
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
  fetchAdminOverview,
  fetchAdminCollection,
  normalizeProduct,
  getAdminToken,
};
