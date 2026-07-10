import React from 'react';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../common/Loader';

export default function ProductGrid({ products = [], loading = false, cols = 4 }) {
  const gridColumns =
    cols >= 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      : cols === 3
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2';

  if (loading) {
    return (
      <div className={`grid justify-items-center gap-4 md:gap-6 ${gridColumns}`}>
        {Array.from({ length: cols * 2 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-white/70 p-12 text-center text-muted">
        No products found.
      </div>
    );
  }

  return (
    <div className={`grid justify-items-center gap-4 md:gap-6 ${gridColumns}`}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
