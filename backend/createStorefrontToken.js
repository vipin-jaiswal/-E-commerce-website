require('dotenv').config();

const storeDomain = String(process.env.SHOPIFY_STORE_DOMAIN || '')
  .trim()
  .replace(/^https?:\/\//, '')
  .replace(/\/.*$/, '');
const apiVersion = process.env.SHOPIFY_API_VERSION || '2026-07';

const adminGraphqlUrl = `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`;

const getAdminToken = async () => {
  if (process.env.SHOPIFY_ADMIN_TOKEN) return process.env.SHOPIFY_ADMIN_TOKEN;

  const { SHOPIFY_CLIENT_ID: clientId, SHOPIFY_CLIENT_SECRET: clientSecret } = process.env;
  if (!clientId || !clientSecret) {
    throw new Error('Set SHOPIFY_ADMIN_TOKEN or SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET in backend/.env');
  }

  const response = await fetch(`https://${storeDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description || `Admin token request failed (HTTP ${response.status})`);
  }
  return payload.access_token;
};

const createStorefrontToken = async () => {
  if (!storeDomain) throw new Error('SHOPIFY_STORE_DOMAIN is missing');

  const query = `mutation StorefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
    storefrontAccessTokenCreate(input: $input) {
      storefrontAccessToken {
        accessToken
        title
        accessScopes { handle }
      }
      userErrors { field message }
    }
  }`;

  const response = await fetch(adminGraphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': await getAdminToken(),
    },
    body: JSON.stringify({ query, variables: { input: { title: 'Dyva Storefront' } } }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(`Shopify Admin API HTTP error ${response.status}: ${JSON.stringify(payload)}`);
  }
  if (payload.errors?.length) {
    throw new Error(`Shopify GraphQL error: ${payload.errors.map((error) => error.message).join(', ')}`);
  }

  const result = payload.data?.storefrontAccessTokenCreate;
  if (result?.userErrors?.length) {
    throw new Error(`Shopify mutation error: ${result.userErrors.map((error) => error.message).join(', ')}`);
  }
  if (!result?.storefrontAccessToken?.accessToken) {
    throw new Error('Shopify did not return a Storefront access token');
  }

  const token = result.storefrontAccessToken;
  console.log('Storefront token created successfully.');
  console.log(`Title: ${token.title}`);
  console.log(`Scopes: ${token.accessScopes.map((scope) => scope.handle).join(', ') || 'none reported'}`);
  console.log('\nAdd this to backend/.env manually:');
  console.log(`SHOPIFY_STOREFRONT_TOKEN=${token.accessToken}`);
};

createStorefrontToken().catch((error) => {
  console.error(`Failed to create Storefront token: ${error.message}`);
  process.exitCode = 1;
});
