const REGION_STATES = {
  north: ['chandigarh', 'delhi', 'haryana', 'himachal pradesh', 'jammu and kashmir', 'ladakh', 'punjab', 'rajasthan', 'uttarakhand', 'uttar pradesh'],
  south: ['andhra pradesh', 'karnataka', 'kerala', 'tamil nadu', 'telangana', 'puducherry', 'lakshadweep'],
  east: ['bihar', 'jharkhand', 'odisha', 'west bengal', 'andaman and nicobar islands'],
  west: ['goa', 'gujarat', 'maharashtra', 'dadra and nagar haveli and daman and diu'],
  central: ['chhattisgarh', 'madhya pradesh'],
  'north-east': ['arunachal pradesh', 'assam', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'sikkim', 'tripura'],
};

const normalizeState = (value = '') => String(value).trim().toLowerCase().replace(/\s+/g, ' ');
const getRegionForState = (state) => Object.entries(REGION_STATES).find(([, states]) => states.includes(normalizeState(state)))?.[0] || null;

module.exports = { REGION_STATES, getRegionForState };
