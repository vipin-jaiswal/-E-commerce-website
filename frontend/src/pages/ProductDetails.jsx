import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import ProductGallery from "../components/product/ProductGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductSlider from "../components/product/ProductSlider";
import ProductReviews from "../components/product/ProductReviews";
import { useProduct, useProducts } from "../hooks/useProducts";

export default function ProductDetails() {
  const { id } = useParams();
  const [reviewSummary, setReviewSummary] = useState(null);
  const [reviewVersion, setReviewVersion] = useState(0);

  const { product, loading } = useProduct(id);

  const { products: related } = useProducts({
    category: product?.category,
    limit: 6,
  });

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!product) {
    return (
      <div className="text-center py-20 bg-gray-50 dark:bg-gray-900">
        <h2 className="text-2xl font-semibold dark:text-white">Product not found</h2>

        <Link to="/products" className="text-pink-500 hover:underline mt-4 inline-block">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] bg-gray-50 px-4 py-6 dark:bg-gray-900 sm:px-6 lg:py-8">
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
        <ProductGallery images={product.images} />

        <ProductInfo
          product={product}
          reviewSummary={reviewSummary}
          onReviewAdded={() => setReviewVersion((version) => version + 1)}
        />
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="text-3xl font-bold mb-8 dark:text-slate-100">
            Related Products
          </h2>

          <ProductSlider products={related} loop={related.length > 4} />
        </div>
      )}

      <ProductReviews
        productId={product.id || product._id}
        onSummaryChange={setReviewSummary}
        refreshKey={reviewVersion}
      />
    </div>
  );
}
