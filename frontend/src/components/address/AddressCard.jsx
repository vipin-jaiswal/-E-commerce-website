import React from 'react';
import { Home, Building2, MapPinned, Pencil, Trash2, CheckCircle2 } from 'lucide-react';

const TYPE_META = {
  Home: { icon: Home, label: 'Home' },
  Office: { icon: Building2, label: 'Office' },
  Other: { icon: MapPinned, label: 'Other' },
};

export default function AddressCard({
  address,
  selectable = false,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  busy = false,
}) {
  const { icon: Icon, label } = TYPE_META[address.type] || TYPE_META.Other;

  return (
    <div
      onClick={selectable ? onSelect : undefined}
      className={`relative rounded-2xl border-2 p-5 transition-all ${
        selectable ? 'cursor-pointer' : ''
      } ${selected ? 'border-emerald-500 bg-emerald-50 shadow-sm dark:bg-emerald-500/10' : 'border-border bg-white hover:border-charcoal/20'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-ivory-dark px-3 py-1 text-xs font-semibold text-charcoal">
            <Icon size={13} /> {label}
          </span>
          {address.isDefault && (
            <span className="rounded-full bg-sage/15 px-3 py-1 text-xs font-semibold text-sage">
              Default
            </span>
          )}
          {selected && (
            <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white">
              Selected for delivery
            </span>
          )}
          {!address.isVerified && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-600">
              Unverified
            </span>
          )}
        </div>

        {selectable && (
          <div
            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
              selected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
            }`}
          >
            {selected && <CheckCircle2 size={14} className="text-white" />}
          </div>
        )}
      </div>

      <div className="mt-3 space-y-0.5 text-sm">
        <p className="font-semibold text-charcoal">{address.name}</p>
        <p className="text-muted">
          {address.address1}
          {address.address2 ? `, ${address.address2}` : ''}
          {address.landmark ? `, near ${address.landmark}` : ''}
        </p>
        <p className="text-muted">
          {[address.area, address.city, address.state, address.pincode].filter(Boolean).join(', ')}
        </p>
        <p className="text-muted">Phone: {address.phone}</p>
      </div>

      {(onEdit || onDelete || onSetDefault) && (
        <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs font-semibold">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(address);
              }}
              className="flex items-center gap-1 text-accent hover:text-accent-dark"
            >
              <Pencil size={13} /> Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(address);
              }}
              className="flex items-center gap-1 text-red-400 hover:text-red-500 disabled:opacity-50"
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
          {onSetDefault && !address.isDefault && (
            <button
              type="button"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                onSetDefault(address);
              }}
              className="ml-auto text-muted hover:text-charcoal disabled:opacity-50"
            >
              Set as Default
            </button>
          )}
        </div>
      )}
    </div>
  );
}
