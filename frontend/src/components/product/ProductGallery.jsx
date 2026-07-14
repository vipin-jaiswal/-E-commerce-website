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
      <div className="flex h-[280px] items-center justify-center overflow-hidden rounded-3xl bg-white p-3 shadow-card dark:bg-slate-800 sm:h-[360px] lg:h-[440px]">
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
