export const formatCurrency = (amount = 0, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(Number(amount) || 0);
};

export default formatCurrency;
