/**
 * WashEasy - Order Model (MongoDB Mongoose Schema)
 */
const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  id: String,
  name: String,
  serviceKey: String,
  serviceLabel: String,
  unitPrice: Number,
  qty: Number,
  totalPrice: Number
});

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  service: {
    type: String,
    required: true
  },
  qty: {
    type: mongoose.Schema.Types.Mixed,
    default: 1
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    default: 0
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  addOns: [String],
  promoCode: {
    type: String,
    default: null
  },
  promoDiscount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'upi', 'online'],
    default: 'cod'
  },
  status: {
    type: String,
    enum: ['Confirmed', 'Picked Up', 'Washing', 'Packed', 'Delivered'],
    default: 'Confirmed'
  },
  customer: {
    name: String,
    phone: String,
    email: String,
    address: String
  },
  pickupDate: {
    type: String,
    required: true
  },
  pickupTime: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);

