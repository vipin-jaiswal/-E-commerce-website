const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Address = require('../models/Address');
const protect = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { getRegionForState } = require('../utils/regions');

const router = express.Router();

const formatOrder = (order) => {
  const plain = typeof order.toObject === 'function' ? order.toObject() : order;
  return { ...plain, id: plain._id.toString(), status: plain.status === 'pending' ? 'ordered' : plain.status };
};

router.post('/', protect, async (req, res) => {
  try {
    const { items, addressId, paymentMethod } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    if (!addressId) return res.status(400).json({ message: 'Please select a delivery address' });
    const address = await Address.findOne({ _id: addressId, user: req.user.id }).lean();
    if (!address) return res.status(400).json({ message: 'Selected delivery address was not found' });
    if (!['card', 'upi', 'netbank', 'cod'].includes(paymentMethod)) return res.status(400).json({ message: 'Please select a valid payment method' });

    const shippingAddress = {
      name: address.name,
      phone: address.phone,
      street: [address.address1, address.address2].filter(Boolean).join(', '),
      city: address.city,
      state: address.state,
      zip: address.pincode,
      country: address.country || 'India',
    };

    const requestedItems = items.map((item) => ({
      productId: String(item.productId || item.id || ''),
      quantity: Number(item.quantity ?? item.qty ?? 0),
    }));

    if (requestedItems.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      return res.status(400).json({ message: 'One or more cart items are invalid' });
    }

    const products = await Promise.all(requestedItems.map((item) => Product.findById(item.productId).lean().catch(() => null)));
    if (products.some((product) => !product)) return res.status(400).json({ message: 'One or more products are no longer available' });

    const deliveryRegion = getRegionForState(shippingAddress.state);
    if (!deliveryRegion) {
      return res.status(400).json({
        message: `We could not identify a delivery region for ${shippingAddress.state}. Please update the address with a valid Indian state.`,
      });
    }
    const unavailableProduct = products.find((product) => {
      const allowedRegions = Array.isArray(product.availableRegions) ? product.availableRegions : [];
      return allowedRegions.length > 0 && (!deliveryRegion || !allowedRegions.includes(deliveryRegion));
    });
    if (unavailableProduct) {
      return res.status(400).json({
        message: `${unavailableProduct.name} is not available for delivery to ${shippingAddress.state}.`,
      });
    }

    const normalizedItems = requestedItems.map((item, index) => {
      const product = products[index];
      return {
        productId: product._id.toString(),
        name: product.name,
        image: product.images?.[0] || '',
        price: Number(product.salePrice ?? product.price ?? 0),
        quantity: item.quantity,
      };
    });

    // Reserve stock atomically so two customers cannot buy the last item at once.
    const reserved = [];
    try {
      for (const item of normalizedItems) {
        const product = await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );
        if (!product) throw new Error(`${item.name} is out of stock or does not have enough quantity available`);
        reserved.push(item);
      }

      const itemsPrice = normalizedItems.reduce((total, item) => total + item.price * item.quantity, 0);
      const order = await Order.create({
        user: req.user.id,
        items: normalizedItems,
        shippingAddress,
        deliveryRegion: deliveryRegion || '',
        paymentMethod,
        status: 'ordered',
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
        itemsPrice,
        shippingPrice: 0,
        taxPrice: 0,
        totalPrice: itemsPrice,
      });

      return res.status(201).json(formatOrder(order));
    } catch (error) {
      await Promise.allSettled(reserved.map((item) => Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } })));
      return res.status(400).json({ message: error.message || 'Unable to reserve product stock' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create order', error: error.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    return res.json(orders.map(formatOrder));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Admin order management: filter by delivery region or fulfilment status.
router.get('/admin/all', protect, requireAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.region) filter.deliveryRegion = String(req.query.region);
    if (req.query.status) filter.status = String(req.query.status);
    const orders = await Order.find(filter).sort({ createdAt: -1 }).populate('user', 'name email phone');
    return res.json({ data: orders.map(formatOrder) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
});

// Customers can cancel only before the order is shipped. Reserved stock is restored.
router.patch('/my/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, status: { $in: ['pending', 'ordered', 'confirmed'] } },
      { $set: { status: 'cancelled' } },
      { new: true }
    );
    if (!order) {
      return res.status(400).json({ message: 'This order can no longer be cancelled' });
    }

    await Promise.all(order.items.map((item) => Product.updateOne(
      { _id: item.productId },
      { $inc: { stock: item.quantity } }
    )));

    return res.json({ data: formatOrder(order) });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to cancel order', error: error.message });
  }
});

router.patch('/admin/:id/status', protect, requireAdmin, async (req, res) => {
  try {
    const status = String(req.body?.status || '');
    if (!['ordered', 'confirmed', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }
    const existingOrder = await Order.findById(req.params.id);
    if (!existingOrder) return res.status(404).json({ message: 'Order not found' });
    if (existingOrder.status === 'cancelled' && status !== 'cancelled') {
      return res.status(400).json({ message: 'A cancelled order cannot be reopened because its stock has already been restored' });
    }

    const shouldRestoreStock = status === 'cancelled' && existingOrder.status !== 'cancelled';
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate('user', 'name email phone');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (shouldRestoreStock) {
      await Promise.all(order.items.map((item) => Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity } }
      )));
    }
    return res.json({ data: formatOrder(order) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    return res.json(formatOrder(order));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch order', error: error.message });
  }
});

module.exports = router;
