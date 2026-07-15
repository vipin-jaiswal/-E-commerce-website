import React from 'react';
import { Star } from 'lucide-react';

export default function Rating({ value = 0, count, size = 14, showCount = true }) {
  const rating = Math.max(0, Math.min(Number(value) || 0, 5));

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const fillPercentage = Math.max(0, Math.min(1, rating - i)) * 100;

          return (
            <span key={i} className="relative block" style={{ height: size, width: size }}>
              <Star size={size} className="absolute inset-0 fill-border text-border" />
              {fillPercentage > 0 && (
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={{ width: `${fillPercentage}%` }}
                >
                  <Star size={size} className="fill-gold text-gold" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      {showCount && count !== undefined && (
        <span className="text-xs text-muted">({count})</span>
      )}
    </div>
  );
}
