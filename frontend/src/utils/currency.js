export const formatCurrency = (amount = 0) => {
  return `Ã¢â€šÂ¹${Number(amount).toLocaleString("en-IN")}`;
};

export default formatCurrency;