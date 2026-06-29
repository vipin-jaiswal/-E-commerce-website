import React from 'react';
import { Star } from 'lucide-react';

export default function Rating({ value = 0, count, size = 14, showCount = true }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={i < Math.round(value) ? 'fill-gold text-gold' : 'text-border fill-border'}
          />
        ))}
      </div>
      {showCount && count !== undefined && (
        <span className="text-xs text-muted">({count})</span>
      )}
    </div>
  );
}
