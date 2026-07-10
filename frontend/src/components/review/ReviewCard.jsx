import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import { ProductCardSkeleton } from '../common/Loader';

export default function ProductSlider({ products = [], loading = false }) {
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd,   setAtEnd]   = useState(false);

  const CARD_W = 240; // approximate card width + gap

  const scroll = (dir) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * CARD_W * 2, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  };

  return (
    <div className="relative group/slider">
      {/* Left arrow */}
      <button
        onClick={() => scroll(-1)}
        disabled={atStart}
        aria-label="Scroll left"
        className={`slider-arrow absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10
          opacity-0 group-hover/slider:opacity-100 transition-opacity duration-200
          ${atStart ? 'invisible' : ''}`}
      >
        <ChevronLeft size={18} />
      </button>

      {/* Track */}
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-2"
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-56"><ProductCardSkeleton /></div>
            ))
          : products.map((p) => (
              <div key={p.id} className="flex-shrink-0 w-56">
                <ProductCard product={p} />
              </div>
            ))
        }
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll(1)}
        disabled={atEnd}
        aria-label="Scroll right"
        className={`slider-arrow absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10
          opacity-0 group-hover/slider:opacity-100 transition-opacity duration-200
          ${atEnd ? 'invisible' : ''}`}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
