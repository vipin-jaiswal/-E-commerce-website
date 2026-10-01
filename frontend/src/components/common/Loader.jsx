import React from 'react';

export function Spinner({ size = 24 }) {
  return (
    <svg
      className="animate-spin text-accent"
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex h-[248px] w-full flex-col overflow-hidden rounded-2xl border border-transparent bg-white shadow-card dark:border-white/10 dark:bg-slate-900 dark:shadow-none sm:block sm:h-auto">
      <div className="skeleton h-[104px] w-full sm:aspect-[3/4] sm:h-auto" />
      <div className="flex flex-1 flex-col space-y-2 p-2 sm:block sm:space-y-2 sm:p-4">
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton mt-auto h-7 w-full rounded-pill sm:mt-3 sm:h-8" />
      </div>
    </div>
  );
}

export default function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Spinner size={36} />
    </div>
  );
}
