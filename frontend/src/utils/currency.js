export const formatCurrency = (amount = 0) => {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

export default formatCurrency;