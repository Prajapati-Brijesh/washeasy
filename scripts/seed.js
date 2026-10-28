/**
 * WashEasy - MongoDB Database Seeder
 * Populates initial users and sample orders in MongoDB
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Order = require('../models/Order');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/washeasy';

const sampleUsers = [
  {
    name: 'Brijesh Prajapati',
    email: 'prajabrijesh67@gmail.com',
    phone: '9876543210',
    password: 'password123',
    address: 'Sector 15, Near City Center',
    role: 'customer'
  },
  {
    name: 'Admin Manager',
    email: 'admin@washeasy.in',
    phone: '9998887776',
    password: 'adminpassword',
    address: 'WashEasy Head Office',
    role: 'admin'
  }
];

const sampleOrders = [
  {
    orderId: 'WE84920',
    service: 'Wash & Fold',
    qty: 5,
    items: [
      { name: 'Shirt / T-Shirt', serviceKey: 'wash_fold', serviceLabel: 'Wash & Fold', unitPrice: 40, qty: 3, totalPrice: 120 },
      { name: 'Jeans / Trousers', serviceKey: 'wash_fold', serviceLabel: 'Wash & Fold', unitPrice: 60, qty: 2, totalPrice: 120 }
    ],
    subtotal: 240,
    deliveryFee: 0,
    addOns: ['Fabric Conditioner / Softener'],
    promoCode: 'FIRST50',
    promoDiscount: 50,
    total: 220,
    paymentMethod: 'cod',
    status: 'Washing',
    customer: {
      name: 'Brijesh Prajapati',
      phone: '9876543210',
      email: 'prajabrijesh67@gmail.com',
      address: 'Sector 15, Near City Center'
    },
    pickupDate: '2026-10-28',
    pickupTime: '9:00 AM – 11:00 AM'
  },
  {
    orderId: 'WE92831',
    service: 'Dry Clean & Iron',
    qty: 2,
    items: [
      { name: 'Blazer / Coat', serviceKey: 'dry_clean', serviceLabel: 'Dry Clean', unitPrice: 250, qty: 1, totalPrice: 250 },
      { name: 'Bedsheet / Quilt Cover', serviceKey: 'dry_clean', serviceLabel: 'Dry Clean', unitPrice: 150, qty: 1, totalPrice: 150 }
    ],
    subtotal: 400,
    deliveryFee: 40,
    addOns: ['Stain Removal Treatment'],
    promoCode: null,
    promoDiscount: 0,
    total: 490,
    paymentMethod: 'upi',
    status: 'Confirmed',
    customer: {
      name: 'Brijesh Prajapati',
      phone: '9876543210',
      email: 'prajabrijesh67@gmail.com',
      address: 'Sector 15, Near City Center'
    },
    pickupDate: '2026-10-29',
    pickupTime: '2:00 PM – 4:00 PM'
  }
];

async function seedDatabase() {
  try {
    console.log('[Seed] Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected to MongoDB.');

    // Clear old sample data
    await User.deleteMany({});
    await Order.deleteMany({});
    console.log('[Seed] Cleared existing collections.');

    // Insert Users
    const createdUsers = await User.insertMany(sampleUsers);
    console.log(`[Seed] Inserted ${createdUsers.length} users successfully!`);

    // Insert Orders
    const createdOrders = await Order.insertMany(sampleOrders);
    console.log(`[Seed] Inserted ${createdOrders.length} orders successfully!`);

    console.log('\n✅ MongoDB Database Seeding Complete!');
    console.log('Database name: washeasy');
    console.log('Collections: users, orders');
    console.log('Sample Order IDs: WE84920, WE92831');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]:', err.message);
    process.exit(1);
  }
}

seedDatabase();
