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
  { key: 'body-care', label: 'Body Care' },
  { key: 'wellness', label: 'Wellness' },
  { key: 'bath', label: 'Bath' },
];

export const SUBCATEGORIES = {
  'skin-care': [
    { key: 'cleanser', label: 'Cleanser' },
    { key: 'serum', label: 'Serum' },
    { key: 'moisturizer', label: 'Moisturizer' },
    { key: 'sunscreen', label: 'Sunscreen' },
  ],
  'hair-care': [
    { key: 'shampoo', label: 'Shampoo' },
    { key: 'conditioner', label: 'Conditioner' },
    { key: 'hair-oil', label: 'Hair Oil' },
    { key: 'mask', label: 'Mask' },
  ],
  makeup: [
    { key: 'lipstick', label: 'Lipstick' },
    { key: 'foundation', label: 'Foundation' },
    { key: 'compact', label: 'Compact' },
    { key: 'eyeliner', label: 'Eyeliner' },
  ],
  'body-care': [
    { key: 'body-wash', label: 'Body Wash' },
    { key: 'body-lotion', label: 'Body Lotion' },
    { key: 'scrub', label: 'Scrub' },
  ],
  wellness: [
    { key: 'supplements', label: 'Supplements' },
    { key: 'stress-relief', label: 'Stress Relief' },
    { key: 'sleep', label: 'Sleep' },
  ],
  bath: [
    { key: 'soap', label: 'Soap' },
    { key: 'bath-salt', label: 'Bath Salt' },
    { key: 'shower-gel', label: 'Shower Gel' },
  ],
};

export const REGION_OPTIONS = [
  { key: 'north', label: 'North' },
  { key: 'south', label: 'South' },
  { key: 'east', label: 'East' },
  { key: 'west', label: 'West' },
  { key: 'central', label: 'Central' },
  { key: 'north-east', label: 'North East' },
];
