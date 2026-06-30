import React from "react";
import { useParams, Link } from "react-router-dom";
import ProductGallery from "../components/product/ProductGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductSlider from "../components/product/ProductSlider";
import ProductReviews from "../components/product/ProductReviews";
import { useProduct, useProducts } from "../hooks/useProducts";

export default function ProductDetails() {
  const { id } = useParams();

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
      <div className="text-center py-20">
        <h2>Product not found</h2>

        <Link to="/products">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <ProductGallery images={product.images} />

        <ProductInfo product={product} />
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="text-3xl font-bold mb-8">
            Related Products
          </h2>

          <ProductSlider products={related} />
        </div>
      )}

      <ProductReviews />
    </div>
  );
}
