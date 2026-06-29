import React, { useState } from 'react';
import { Tag, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const VALID_COUPONS = {
  LUMIERE15: { discount: 0.15, label: '15% off' },
  FIRST10:   { discount: 0.10, label: '10% off' },
};

export default function CouponBox({ onApply }) {
  const [code,    setCode]    = useState('');
  const [applied, setApplied] = useState(null);

  const apply = () => {
    const coupon = VALID_COUPONS[code.trim().toUpperCase()];
    if (coupon) {
      setApplied({ code: code.toUpperCase(), ...coupon });
      onApply?.(coupon.discount);
      toast.success(`Coupon applied — ${coupon.label}!`);
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const remove = () => {
    setApplied(null);
    setCode('');
    onApply?.(0);
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between bg-sage/10 border border-sage/30 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-sage font-medium">
          <CheckCircle size={16} />
          {applied.code} — {applied.label}
        </div>
        <button onClick={remove} className="text-xs text-muted hover:text-red-400 transition-colors underline">
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-0 overflow-hidden border border-border rounded-xl">
      <div className="flex items-center px-3 text-muted">
        <Tag size={16} />
      </div>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && apply()}
        placeholder="Enter coupon code"
        className="flex-1 text-sm text-charcoal placeholder:text-muted py-3 outline-none bg-transparent"
      />
      <button
        onClick={apply}
        className="px-4 text-sm font-semibold text-accent hover:text-accent-dark transition-colors border-l border-border"
      >
        Apply
      </button>
    </div>
  );
}
