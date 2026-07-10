import React from 'react';

const variants = {
  primary: 'bg-charcoal text-white hover:bg-accent',
  outline:  'border border-charcoal text-charcoal hover:bg-charcoal hover:text-white',
  accent:   'bg-accent text-white hover:bg-accent-dark',
  ghost:    'text-charcoal hover:bg-ivory-dark',
};

const sizes = {
  sm: 'text-xs px-4 py-2',
  md: 'text-sm px-6 py-2.5',
  lg: 'text-base px-8 py-3',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = ' text-pink-600 hover:text-pink-400',
  loading = false,
  ...props
}) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-body font-medium rounded-pill
        transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      )}
      {children}
    </button>
  );
}
