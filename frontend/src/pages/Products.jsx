import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductGrid from "../components/product/ProductGrid";
import { useProducts } from "../hooks/useProducts";
import { SORT_OPTIONS, CATEGORIES } from "../utils/constants";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = {
    q: searchParams.get("q") || undefined,
    category: searchParams.get("category") || undefined,
    sort: searchParams.get("sort") || "newest",
  };

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

  return (
    <div className="max-w-[1500px] mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-6">Products</h1>

      <div className="flex gap-3 mb-8 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              setParam(
                "category",
                params.category === cat ? "" : cat
              )
            }
            className="px-4 py-2 border rounded-lg"
          >
            {cat}
          </button>
        ))}

        <select
          value={params.sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="border px-3 py-2 rounded-lg"
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