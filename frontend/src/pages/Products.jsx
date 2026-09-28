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
  const isCategoryComingSoon = Boolean(selectedCategory && selectedCategory !== "hair-care");

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
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold dark:text-slate-100">{pageTitle}</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2">
            {isCategoryComingSoon
              ? `${pageTitle} products are coming soon. Preview our upcoming line.`
              : "Explore our collection and find the perfect beauty essentials."}
          </p>
        </div>
        {selectedCategory === "hair-care" && (
          <span className="rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            Available Now
          </span>
        )}
      </div>

      {isCategoryComingSoon && (
        <div className="mb-8 rounded-2xl border border-primary/25 bg-primary-soft/50 p-6 text-charcoal dark:border-primary/30 dark:bg-primary-soft/20 dark:text-white">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-200/80 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-900 dark:bg-amber-800/40 dark:text-amber-200">
              Coming Soon
            </span>
            <h2 className="text-lg font-bold">{pageTitle} Collection</h2>
          </div>
          <p className="mt-2 text-sm text-amber-800/90 dark:text-amber-300/85">
            We are carefully formulating our {pageTitle.toLowerCase()} collection. Preview the items below—purchasing will open upon launch.
          </p>
        </div>
      )}

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
              {cat.label} {cat.key !== "hair-care" ? "(Coming Soon)" : ""}
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

      {!loading && products.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center dark:border-white/10 dark:bg-slate-900">
          <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
            {isCategoryComingSoon ? `${pageTitle} is Coming Soon` : "No Products Found"}
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {isCategoryComingSoon
              ? `We are preparing our ${pageTitle.toLowerCase()} products for release. Check back soon!`
              : "Try adjusting your search or category filter to find what you are looking for."}
          </p>
        </div>
      ) : (
        <ProductGrid products={products} loading={loading} cols={4} />
      )}
    </div>
  );
}
