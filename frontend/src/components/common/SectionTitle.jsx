import React from 'react';

export default function SectionTitle({ eyebrow, title, subtitle, center = false }) {
  return (
    <div className={`mb-10 ${center ? 'text-center' : ''}`}>
      {eyebrow && (
        <p className="eyebrow mb-2">{eyebrow}</p>
      )}
      <h2 className="font-display text-3xl md:text-4xl font-semibold text-charcoal leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm text-muted max-w-lg leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
