import React, { useMemo, useState } from 'react';

export default function ProductGallery({ images = [] }) {
  const gallery = useMemo(
    () => (Array.isArray(images) && images.length ? images : ['/placeholder.jpg']),
    [images]
  );
  const [active, setActive] = useState(0);
  const current = gallery[Math.min(active, gallery.length - 1)];

  return (
    <div className="space-y-3 lg:sticky lg:top-24">
      <div className="flex aspect-square w-full max-w-[520px] shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-[var(--color-surface)] p-3 shadow-card">
        <img
          src={current}
          alt="Product"
          className="h-full w-full object-contain"
        />
      </div>

      {gallery.length > 1 && (
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`h-16 overflow-hidden rounded-xl border-2 transition sm:h-20 ${
                index === active ? 'border-charcoal' : 'border-transparent'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
