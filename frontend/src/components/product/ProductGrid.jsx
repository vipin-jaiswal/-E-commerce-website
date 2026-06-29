import React from 'react';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../common/Loader';

export default function ProductGrid({ products = [], loading = false, cols = 4 }) {
  const gridStyle = {
    gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:gap-6" style={gridStyle}>
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
    <div className="grid gap-4 md:gap-6" style={gridStyle}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
