const rawApiBase = import.meta.env.VITE_API_URL || '';

export const API_BASE = rawApiBase
  ? rawApiBase.replace(/\/$/, '').endsWith('/api')
    ? rawApiBase.replace(/\/$/, '')
    : `${rawApiBase.replace(/\/$/, '')}/api`
  : '/api';

export const SORT_OPTIONS = [
  { label: 'Newest',       value: 'newest' },
  { label: 'Best Sellers', value: 'best_seller' },
  { label: 'Price: Low',   value: 'price_asc' },
  { label: 'Price: High',  value: 'price_desc' },
  { label: 'Top Rated',    value: 'rating' },
];

export const CATEGORIES = [
  { key: 'skin-care', label: 'Skin Care' },
  { key: 'hair-care', label: 'Hair Care' },
  { key: 'makeup', label: 'Makeup' },
];
