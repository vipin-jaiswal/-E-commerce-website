import React from 'react';
import { CreditCard, Smartphone, Building2, Banknote } from 'lucide-react';

const METHODS = [
  { id: 'card',   label: 'Credit / Debit Card', icon: CreditCard,   sub: 'Visa, Mastercard, RuPay' },
  { id: 'upi',    label: 'UPI',                  icon: Smartphone,   sub: 'GPay, PhonePe, Paytm, BHIM' },
  { id: 'netbank',label: 'Net Banking',           icon: Building2,    sub: 'All major banks supported' },
  { id: 'cod',    label: 'Cash on Delivery',      icon: Banknote,     sub: 'Pay when you receive' },
];

export default function PaymentMethod({ selected, onSelect }) {
  return (
    <div className="space-y-3">
      {METHODS.map(({ id, label, icon: Icon, sub }) => (
        <label
          key={id}
          htmlFor={`pay-${id}`}
          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
            ${selected === id
              ? 'border-accent bg-accent/5'
              : 'border-border bg-white hover:border-charcoal/30'}`}
        >
          <input
            type="radio"
            id={`pay-${id}`}
            name="payment"
            value={id}
            checked={selected === id}
            onChange={() => onSelect(id)}
            className="accent-accent"
          />
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center
            ${selected === id ? 'bg-accent/10 text-accent' : 'bg-ivory-dark text-muted'}`}>
            <Icon size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-charcoal">{label}</p>
            <p className="text-xs text-muted">{sub}</p>
          </div>
        </label>
      ))}
    </div>
  );
}
