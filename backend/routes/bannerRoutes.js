const express = require('express');
const Banner = require('../models/Banner');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

const normalize = (banner) => ({ ...banner, id: banner.id || banner._id?.toString() });
const cleanDate = (value) => (value ? new Date(value) : null);
const payloadFor = (payload = {}) => ({
  title: String(payload.title || '').trim(),
  image: String(payload.image || '').trim(),
  link: String(payload.link || '/products').trim() || '/products',
  isActive: Boolean(payload.isActive),
  sortOrder: Number(payload.sortOrder) || 0,
  startsAt: cleanDate(payload.startsAt),
  endsAt: cleanDate(payload.endsAt),
});

// Public storefront endpoint: only banners that should be live now.
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const banners = await Banner.find({
      isActive: true,
      $and: [
        { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: null }, { endsAt: { $gte: now } }] },
      ],
    }).sort({ sortOrder: 1, createdAt: -1 }).lean();
    return res.json({ data: banners.map(normalize) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/admin/all', auth, requireAdmin, async (_req, res) => {
  try {
    const banners = await Banner.find({}).sort({ sortOrder: 1, createdAt: -1 }).lean();
    return res.json({ data: banners.map(normalize) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const payload = payloadFor(req.body);
    if (!payload.title || !payload.image) return res.status(400).json({ message: 'Title and image are required' });
    if (payload.startsAt && payload.endsAt && payload.endsAt < payload.startsAt) return res.status(400).json({ message: 'End date must be after start date' });
    const banner = await Banner.create(payload);
    return res.status(201).json({ data: normalize(banner.toObject()) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const payload = payloadFor(req.body);
    if (!payload.title || !payload.image) return res.status(400).json({ message: 'Title and image are required' });
    if (payload.startsAt && payload.endsAt && payload.endsAt < payload.startsAt) return res.status(400).json({ message: 'End date must be after start date' });
    const banner = await Banner.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true }).lean();
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    return res.json({ data: normalize(banner) });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    return res.json({ message: 'Banner deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
