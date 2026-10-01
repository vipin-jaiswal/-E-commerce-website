// Use Shopify's app-resolved identifier; the concrete app--<id>-- type varies by app installation.
const REVIEW_TYPE = "$app:dyva_product_review";
const APP_OWNED_REVIEW_TYPE = REVIEW_TYPE;

// This schema matches the fields written by createProductReview() and read by mapReview().
const REVIEW_FIELDS = [
  { key: "product_handle", name: "Product handle", type: "single_line_text_field", required: true },
  { key: "author", name: "Reviewer name", type: "single_line_text_field", required: true },
  { key: "rating", name: "Star rating", type: "number_integer", required: true },
  { key: "title", name: "Review title", type: "single_line_text_field", required: false },
  { key: "body", name: "Review", type: "multi_line_text_field", required: true },
  { key: "created_at", name: "Submitted at", type: "date_time", required: true },
];

module.exports = { REVIEW_TYPE, APP_OWNED_REVIEW_TYPE, REVIEW_FIELDS };
