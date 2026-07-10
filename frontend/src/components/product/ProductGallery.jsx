import React, { useMemo, useState } from 'react';

export default function ProductGallery({ images = [] }) {
  const gallery = useMemo(
    () => (Array.isArray(images) && images.length ? images : ['/placeholder.jpg']),
    [images]
  );
  const [active, setActive] = useState(0);
  const current = gallery[Math.min(active, gallery.length - 1)];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl bg-ivory-dark shadow-card">
        <img
          src={current}
          alt="Product"
          className="aspect-[4/5] h-full w-full object-cover"
        />
      </div>

      {gallery.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`overflow-hidden rounded-2xl border-2 transition ${
                index === active ? 'border-charcoal' : 'border-transparent'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="aspect-square h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
