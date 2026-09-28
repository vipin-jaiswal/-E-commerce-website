const dotenv = require('dotenv');

// Load environment variables before importing modules that read them at startup.
dotenv.config();

const { checkShopifyConnection } = require('./services/shopifyService');

const app = require('./server');
const PORT = process.env.PORT || 5000;

const start = async () => {
  if (!process.env.SHOPIFY_STOREFRONT_TOKEN) {
    console.warn('[shopify] SHOPIFY_STOREFRONT_TOKEN is missing; cart and checkout requests will be unavailable');
  }

  try {
    await checkShopifyConnection();
    console.log('[shopify] Connected successfully');
  } catch (error) {
    console.error('[shopify] Connection failed:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`[server] Server is running on port ${PORT}`);
  });
};

start().catch((error) => {
  console.error('[server] Failed to start:', error);
  process.exit(1);
});
