export const formatPrice = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

export const calcDiscount = (price, original) =>
  original ? Math.round(((original - price) / original) * 100) : 0;
