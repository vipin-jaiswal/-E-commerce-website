require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');

const storeDomain = String(process.env.SHOPIFY_STORE_DOMAIN || '')
  .trim()
  .replace(/^https?:\/\//, '')
  .replace(/\/.*$/, '');
const apiVersion = process.env.SHOPIFY_API_VERSION || '2026-07';

const adminGraphqlUrl = `https://${storeDomain}/admin/api/${apiVersion}/graphql.json`;
const METAOBJECT_SCOPE = 'unauthenticated_read_metaobjects';
const envPath = path.join(__dirname, '.env');

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

const saveStorefrontToken = (token) => {
  const current = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const newline = current.includes('\r\n') ? '\r\n' : '\n';
  const lines = current.split(/\r?\n/);
  let replaced = false;
  const updated = lines.map((line) => {
    if (!line.startsWith('SHOPIFY_STOREFRONT_TOKEN=')) return line;
    replaced = true;
    return `SHOPIFY_STOREFRONT_TOKEN=${token}`;
  });
  if (!replaced) updated.push(`SHOPIFY_STOREFRONT_TOKEN=${token}`);
  fs.writeFileSync(envPath, updated.join(newline), 'utf8');
};

const createStorefrontToken = async () => {
  if (!storeDomain) throw new Error('SHOPIFY_STORE_DOMAIN is missing');

  const adminToken = await getAdminToken();
  const scopesResponse = await fetch(adminGraphqlUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
    },
    body: JSON.stringify({
      query: `query CurrentAppScopes {
        currentAppInstallation { accessScopes { handle } }
      }`,
    }),
  });
  const scopesPayload = await scopesResponse.json();
  if (!scopesResponse.ok || scopesPayload.errors?.length) {
    throw new Error(
      `Unable to verify installed Shopify scopes: ${scopesPayload.errors?.map((error) => error.message).join(', ') || `HTTP ${scopesResponse.status}`}`
    );
  }
  const grantedScopes = new Set(
    (scopesPayload.data?.currentAppInstallation?.accessScopes || []).map((scope) => scope.handle)
  );
  if (!grantedScopes.has(METAOBJECT_SCOPE)) {
    throw new Error(
      `The installed DYVA app has not been granted ${METAOBJECT_SCOPE}. Open the app in Shopify Admin and approve the updated permissions, then run this script again.`
    );
  }

  const query = `mutation StorefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
    storefrontAccessTokenCreate(input: $input) {
      storefrontAccessToken {
        id
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
      'X-Shopify-Access-Token': adminToken,
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
  const tokenScopes = token.accessScopes.map((scope) => scope.handle);
  if (!tokenScopes.includes(METAOBJECT_SCOPE)) {
    throw new Error(
      `The new Storefront token is missing ${METAOBJECT_SCOPE}. No token was saved to backend/.env.`
    );
  }

  console.log('Storefront token created successfully.');
  console.log(`Title: ${token.title}`);
  console.log(`Scopes: ${tokenScopes.join(', ') || 'none reported'}`);
  saveStorefrontToken(token.accessToken);
  console.log('Updated SHOPIFY_STOREFRONT_TOKEN in backend/.env. Token value was not printed.');
};

createStorefrontToken().catch((error) => {
  console.error(`Failed to create Storefront token: ${error.message}`);
  process.exitCode = 1;
});
