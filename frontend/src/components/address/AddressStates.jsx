import React from 'react';
import { MapPin, Plus } from 'lucide-react';

export function AddressCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border-2 border-border bg-white p-5">
      <div className="mb-3 flex gap-2">
        <div className="h-5 w-16 rounded-full bg-gray-200" />
        <div className="h-5 w-16 rounded-full bg-gray-200" />
      </div>
      <div className="space-y-2">
        <div className="h-3.5 w-32 rounded bg-gray-200" />
        <div className="h-3.5 w-full rounded bg-gray-200" />
        <div className="h-3.5 w-2/3 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function AddressListSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <AddressCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AddressEmptyState({ onAddNew }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-ivory-dark/40 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-card">
        <MapPin size={24} className="text-accent" />
      </div>
      <h3 className="font-display text-lg font-semibold text-charcoal">No saved addresses yet</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Add a home, office, or other address to check out faster next time.
      </p>
      <button
        type="button"
        onClick={onAddNew}
        className="mt-5 flex items-center gap-2 rounded-full bg-charcoal px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent"
      >
        <Plus size={16} /> Add New Address
      </button>
    </div>
  );
}
