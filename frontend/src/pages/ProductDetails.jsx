import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ProductGallery from "../components/product/ProductGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductSlider from "../components/product/ProductSlider";
import ReviewSection from "../components/review/ReviewSection";
import { useProduct, useProducts } from "../hooks/useProducts";
import api from "../services/api";

export default function ProductDetails() {
  const { id } = useParams();
  const { product, loading } = useProduct(id);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!product?.handle) {
      setReviews([]);
      return undefined;
    }

    let active = true;
    api.get("/reviews", { params: { productHandle: product.handle } })
      .then(({ data }) => {
        if (active) setReviews(Array.isArray(data?.data) ? data.data : []);
      })
      .catch(() => {
        if (active) setReviews([]);
      });

    return () => { active = false; };
  }, [product?.handle]);

  const { products: related } = useProducts({
    category: product?.category,
    limit: 6,
  });

  if (loading) {
    return <div className="min-h-screen bg-[var(--color-bg)] px-4 py-20 text-center text-[var(--color-text)]">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] py-20 text-center text-[var(--color-text)]">
        <h2 className="text-2xl font-semibold">Product not found</h2>

        <Link to="/products" className="mt-4 inline-block text-[var(--color-text)] hover:text-primary hover:underline">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-[1400px] bg-[var(--color-bg)] px-4 py-4 text-[var(--color-text)] sm:px-6 sm:py-6 lg:py-8">
      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
        <ProductGallery images={product.images} />

        <ProductInfo
          product={product}
          reviews={reviews}
        />
      </div>

      {related.length > 0 && (
        <div className="mt-10 sm:mt-20">
          <h2 className="mb-5 text-2xl font-bold dark:text-slate-100 sm:mb-8 sm:text-3xl">
            Related Products
          </h2>

          <ProductSlider products={related} loop={related.length > 4} />
        </div>
      )}

      <ReviewSection productHandle={product.handle} reviews={product.reviews || []} />

    </div>
  );
}
