export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const SORT_OPTIONS = [
  { label: 'Newest',       value: 'newest' },
  { label: 'Best Sellers', value: 'best_seller' },
  { label: 'Price: Low',   value: 'price_asc' },
  { label: 'Price: High',  value: 'price_desc' },
  { label: 'Top Rated',    value: 'rating' },
];

export const CATEGORIES = ['skincare', 'serums', 'moisturisers', 'spf', 'masks', 'eye-care'];
