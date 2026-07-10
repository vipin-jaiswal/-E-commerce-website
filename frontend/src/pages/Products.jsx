import React from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ProductGrid from "../components/product/ProductGrid";
import { useProducts } from "../hooks/useProducts";
import { SORT_OPTIONS, CATEGORIES } from "../utils/constants";

export default function Products() {
  const { category: routeCategory } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const params = {
    q: searchParams.get("q") || undefined,
    category: routeCategory || searchParams.get("category") || undefined,
    sort: searchParams.get("sort") || "newest",
    bestSeller: searchParams.get("sort") === "best_seller" ? true : undefined,
    limit: 0,
  };
  const selectedCategory = params.category || "";
  const pageTitle = selectedCategory
    ? CATEGORIES.find((cat) => cat.key === selectedCategory)?.label || "Products"
    : "All Products";

  const { products, loading } = useProducts(params);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    setSearchParams(next);
  };

  const handleCategoryChange = (event) => {
    const nextCategory = event.target.value;
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.delete("category");

    if (nextCategory) {
      navigate(`/products/category/${nextCategory}?${nextSearchParams.toString()}`);
      return;
    }

    navigate(`/products?${nextSearchParams.toString()}`);
  };

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold mb-2">{pageTitle}</h1>
      <p className="text-gray-500 dark:text-slate-400 mb-6">
        Browse all products stored in the backend or filter by category.
      </p>

      <div className="flex gap-3 mb-8 flex-wrap items-center">
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="border px-4 py-2 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          aria-label="Filter products by category"
        >
          <option value="">All Products</option>
          {CATEGORIES.map((cat) => (
            <option key={cat.key} value={cat.key}>
              {cat.label}
            </option>
          ))}
        </select>

        <select
          value={params.sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="border px-4 py-2 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
          aria-label="Sort products"
        >
          {SORT_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <ProductGrid
        products={products}
        loading={loading}
        cols={4}
      />
    </div>
  );
}
