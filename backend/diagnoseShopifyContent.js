require('dotenv').config();

const ANNOUNCEMENT_TYPE = 'app--428015452161--dyva_announcement';
const BANNER_TYPE = 'app--428015452161--dyva_hero_banner';
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-07';
const STORE_DOMAIN = String(process.env.SHOPIFY_STORE_DOMAIN || '')
  .trim()
  .replace(/^https?:\/\//i, '')
  .replace(/\/$/, '');
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || '';

const storefrontQuery = `query DiagnosticContent($announcementType: String!, $bannerType: String!) {
  announcements: metaobjects(type: $announcementType, first: 20) {
    nodes { id type handle fields { key } }
  }
  banners: metaobjects(type: $bannerType, first: 50) {
    nodes { id type handle fields { key } }
  }
}`;

const storefrontVariables = {
  announcementType: ANNOUNCEMENT_TYPE,
  bannerType: BANNER_TYPE,
};

const adminQuery = `query DiagnosticAdminContent($announcementType: String!, $bannerType: String!) {
  announcementDefinition: metaobjectDefinitionByType(type: $announcementType) {
    type
    name
    access { storefront customerAccount }
    fieldDefinitions { key name type { name } }
  }
  bannerDefinition: metaobjectDefinitionByType(type: $bannerType) {
    type
    name
    access { storefront customerAccount }
    fieldDefinitions { key name type { name } }
  }
  announcementEntries: metaobjects(type: $announcementType, first: 250) {
    nodes { id handle fields { key value } }
  }
  bannerEntries: metaobjects(type: $bannerType, first: 250) {
    nodes { id handle fields { key value } }
  }
}`;

const postGraphql = async (url, headers, query, variables) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ query, variables }),
  });
  const rawBody = await response.text();
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    payload = { errors: [{ message: `Non-JSON response (HTTP ${response.status})` }] };
  }
  return { status: response.status, payload };
};

const safeNode = (node) => ({
  id: node.id,
  type: node.type,
  handle: node.handle,
  fieldKeys: (node.fields || []).map((field) => field.key),
});

const accessDescription = (access) => {
  if (access == null) return null;
  if (typeof access === 'string') return access;
  return {
    storefront: access.storefront ?? null,
    customerAccount: access.customerAccount ?? null,
  };
};

const getAdminToken = async () => {
  if (process.env.SHOPIFY_ADMIN_TOKEN) return process.env.SHOPIFY_ADMIN_TOKEN;

  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const response = await fetch(`https://${STORE_DOMAIN}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    throw new Error(`Admin authentication failed (HTTP ${response.status}): ${payload.error || 'no access token returned'}`);
  }
  return payload.access_token;
};

const printErrors = (errors) =>
  (errors || []).map((error) => ({
    message: error.message,
    path: error.path,
    extensions: error.extensions,
  }));

const main = async () => {
  console.log(`STORE_DOMAIN: ${STORE_DOMAIN || '(missing)'}`);
  console.log(`API_VERSION: ${API_VERSION}`);
  console.log(`STOREFRONT_TOKEN_EXISTS: ${Boolean(STOREFRONT_TOKEN)}`);
  console.log(`STOREFRONT_TOKEN_LENGTH: ${STOREFRONT_TOKEN.length}`);
  console.log(`STOREFRONT_TOKEN_PREFIX_6: ${STOREFRONT_TOKEN.slice(0, 6)}`);

  let storefrontResult = null;
  if (!STORE_DOMAIN || !STOREFRONT_TOKEN) {
    console.log('STORE_FRONT_STATUS: NOT_REQUESTED (store domain or Storefront token missing)');
    console.log('GRAPHQL_ERRORS: []');
    console.log('ANNOUNCEMENT_COUNT: unavailable');
    console.log('ANNOUNCEMENT_NODES: []');
    console.log('BANNER_COUNT: unavailable');
    console.log('BANNER_NODES: []');
  } else {
    try {
      storefrontResult = await postGraphql(
        `https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`,
        { 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN },
        storefrontQuery,
        storefrontVariables
      );
      const data = storefrontResult.payload.data || {};
      const announcementNodes = data.announcements?.nodes || [];
      const bannerNodes = data.banners?.nodes || [];
      console.log(`STORE_FRONT_STATUS: ${storefrontResult.status}`);
      console.log(`GRAPHQL_ERRORS: ${JSON.stringify(printErrors(storefrontResult.payload.errors))}`);
      console.log(`ANNOUNCEMENT_COUNT: ${announcementNodes.length}`);
      console.log(`ANNOUNCEMENT_NODES: ${JSON.stringify(announcementNodes.map(safeNode))}`);
      console.log(`BANNER_COUNT: ${bannerNodes.length}`);
      console.log(`BANNER_NODES: ${JSON.stringify(bannerNodes.map(safeNode))}`);
    } catch (error) {
      storefrontResult = { networkError: error.message };
      console.log('STORE_FRONT_STATUS: no HTTP response');
      console.log(`GRAPHQL_ERRORS: []`);
      console.log(`STOREFRONT_REQUEST_ERROR: ${error.message}`);
      console.log('ANNOUNCEMENT_COUNT: unavailable');
      console.log('ANNOUNCEMENT_NODES: []');
      console.log('BANNER_COUNT: unavailable');
      console.log('BANNER_NODES: []');
    }
  }

  let adminResult = null;
  try {
    const adminToken = await getAdminToken();
    if (!STORE_DOMAIN || !adminToken) {
      console.log('ADMIN_DIAGNOSTICS: unavailable (store domain or Admin credentials missing)');
    } else {
      const result = await postGraphql(
        `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
        { 'X-Shopify-Access-Token': adminToken },
        adminQuery,
        storefrontVariables
      );
      const data = result.payload.data || {};
      const announcements = data.announcementEntries?.nodes || [];
      const banners = data.bannerEntries?.nodes || [];
      const announcementEnabled = announcements.map((entry) => ({
        id: entry.id,
        handle: entry.handle,
        enabled: (entry.fields || []).find((field) => field.key === 'enabled')?.value ?? null,
        fieldKeys: (entry.fields || []).map((field) => field.key),
      }));
      const bannerEntriesSafe = banners.map((entry) => ({
        id: entry.id,
        handle: entry.handle,
        enabled: (entry.fields || []).find((field) => field.key === 'enabled')?.value ?? null,
        fieldKeys: (entry.fields || []).map((field) => field.key),
      }));
      adminResult = {
        status: result.status,
        errors: result.payload.errors || [],
        announcementDefinition: data.announcementDefinition || null,
        bannerDefinition: data.bannerDefinition || null,
        announcementEntries: announcements,
        bannerEntries: banners,
      };
      console.log(`ADMIN_STATUS: ${result.status}`);
      console.log(`ADMIN_GRAPHQL_ERRORS: ${JSON.stringify(printErrors(result.payload.errors))}`);
      console.log(`ANNOUNCEMENT_DEFINITION: ${JSON.stringify({ type: data.announcementDefinition?.type ?? null, name: data.announcementDefinition?.name ?? null, storefrontAccess: accessDescription(data.announcementDefinition?.access), fieldDefinitions: data.announcementDefinition?.fieldDefinitions ?? [] })}`);
      console.log(`BANNER_DEFINITION: ${JSON.stringify({ type: data.bannerDefinition?.type ?? null, name: data.bannerDefinition?.name ?? null, storefrontAccess: accessDescription(data.bannerDefinition?.access), fieldDefinitions: data.bannerDefinition?.fieldDefinitions ?? [] })}`);
      console.log(`ANNOUNCEMENT_ENTRY_COUNT: ${announcements.length}`);
      console.log(`ANNOUNCEMENT_ENTRIES: ${JSON.stringify(announcementEnabled)}`);
      console.log(`HERO_BANNER_ENTRY_COUNT: ${banners.length}`);
      console.log(`HERO_BANNER_ENTRIES: ${JSON.stringify(bannerEntriesSafe)}`);
    }
  } catch (error) {
    console.log(`ADMIN_DIAGNOSTICS: failed (${error.message})`);
  }

  const storeErrors = storefrontResult?.payload?.errors || [];
  const adminErrors = adminResult?.errors || [];
  let classification;
  if (storefrontResult?.networkError) {
    classification = 'E = Storefront request failed before HTTP response';
  } else if (storeErrors.some((error) => /Required access: unauthenticated_read_metaobjects/i.test(error.message || ''))) {
    classification = 'A = Storefront token missing unauthenticated_read_metaobjects';
  } else if (storeErrors.length) {
    classification = `F = another specific Shopify GraphQL error: ${storeErrors.map((error) => error.message).join(' | ')}`;
  } else if (adminResult && (adminErrors.length || !adminResult.announcementDefinition || !adminResult.bannerDefinition)) {
    classification = `F = Admin diagnostic GraphQL error: ${adminErrors.map((error) => error.message).join(' | ') || 'definition result missing'}`;
  } else if (adminResult && [adminResult.announcementDefinition, adminResult.bannerDefinition].some((definition) => {
    const access = definition?.access;
    return access && typeof access === 'object' && access.storefront === 'NONE';
  })) {
    classification = 'B = Metaobject Storefront access disabled';
  } else if (storefrontResult?.payload?.data?.announcements?.nodes?.length) {
    classification = 'D = Storefront returns announcement; inspect backend mapping';
  } else if (storefrontResult && adminResult && !storefrontResult.payload.errors?.length) {
    classification = 'C = Both permissions appear correct but Storefront returns zero announcement nodes';
  } else {
    classification = 'F = diagnostic data incomplete; inspect the reported HTTP errors';
  }
  console.log(`CLASSIFICATION: ${classification}`);
};

main().catch((error) => {
  console.error(`DIAGNOSTIC_FAILED: ${error.message}`);
  process.exitCode = 1;
});
