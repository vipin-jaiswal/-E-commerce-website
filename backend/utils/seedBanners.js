const Banner = require('../models/Banner');

const defaults = [
  { title: 'Skin care collection', image: '/banners/banner1.png', link: '/products/category/skin-care', sortOrder: 1 },
  { title: 'Makeup collection', image: '/banners/banner2.png', link: '/products/category/makeup', sortOrder: 2 },
  { title: 'Hair care collection', image: '/banners/banner3.png', link: '/products/category/hair-care', sortOrder: 3 },
];

module.exports = async function seedBanners() {
  if (await Banner.exists({})) return;
  await Banner.insertMany(defaults);
};
