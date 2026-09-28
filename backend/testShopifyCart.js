require('dotenv').config();

const domain = String(process.env.SHOPIFY_STORE_DOMAIN || '')
  .trim()
  .replace(/^https?:\/\//, '')
  .replace(/\/.*$/, '');
const version = process.env.SHOPIFY_API_VERSION || '2026-07';
const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
const url = `https://${domain}/api/${version}/graphql.json`;

const request = async (query, variables = {}) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(payload)}`);
  if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message).join(', '));
  return payload.data;
};

const assertNoUserErrors = (result, label) => {
  const errors = result.userErrors || [];
  if (errors.length) throw new Error(`${label}: ${errors.map((error) => error.message).join(', ')}`);
};

const run = async () => {
  if (!token) throw new Error('SHOPIFY_STOREFRONT_TOKEN is missing from backend/.env');

  console.log('SHOPIFY STOREFRONT API');
  const products = await request(`query TestProduct($first: Int!) {
    products(first: $first) {
      nodes { variants(first: 1) { nodes { id availableForSale } } }
    }
  }`, { first: 20 });
  const variant = products.products.nodes
    .flatMap((product) => product.variants.nodes)
    .find((candidate) => candidate.availableForSale);
  if (!variant) throw new Error('No available Shopify product variant was found for testing');
  console.log('STATUS: SUCCESS');

  const created = await request(`mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }`, { input: {} });
  assertNoUserErrors(created.cartCreate, 'CART CREATE');
  const cartId = created.cartCreate.cart.id;
  console.log(`CART CREATE: SUCCESS (${cartId})`);

  const added = await request(`mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { id checkoutUrl lines(first: 10) { nodes { id quantity } } }
      userErrors { field message }
    }
  }`, { cartId, lines: [{ merchandiseId: variant.id, quantity: 1 }] });
  assertNoUserErrors(added.cartLinesAdd, 'ADD LINE');
  const lineId = added.cartLinesAdd.cart.lines.nodes[0]?.id;
  if (!lineId) throw new Error('ADD LINE: Shopify returned no cart line ID');
  console.log('ADD LINE: SUCCESS');

  const fetched = await request(`query Cart($id: ID!) {
    cart(id: $id) { id checkoutUrl totalQuantity lines(first: 10) { nodes { id quantity } } }
  }`, { id: cartId });
  if (!fetched.cart) throw new Error('GET CART: Shopify returned no cart');
  console.log('GET CART: SUCCESS');

  const updated = await request(`mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart { id lines(first: 10) { nodes { id quantity } } }
      userErrors { field message }
    }
  }`, { cartId, lines: [{ id: lineId, quantity: 2 }] });
  assertNoUserErrors(updated.cartLinesUpdate, 'UPDATE LINE');
  console.log('UPDATE LINE: SUCCESS');

  const removed = await request(`mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart { id checkoutUrl lines(first: 10) { nodes { id } } }
      userErrors { field message }
    }
  }`, { cartId, lineIds: [lineId] });
  assertNoUserErrors(removed.cartLinesRemove, 'REMOVE LINE');
  console.log('REMOVE LINE: SUCCESS');
  console.log(`CHECKOUT URL: ${removed.cartLinesRemove.cart.checkoutUrl}`);
};

run().catch((error) => {
  console.error(`STATUS: FAILED - ${error.message}`);
  process.exitCode = 1;
});
