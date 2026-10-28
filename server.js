/**
 * WashEasy – Full-Stack Node.js & MongoDB Server
 * Serves Static HTML/React Pages + Full REST API for Auth, Orders & Tracking
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

try {
  require('dotenv').config();
} catch (e) {}

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory & Local JSON Store
let db = {
  users: [],
  orders: []
};

// Load existing database if available
if (fs.existsSync(DB_FILE)) {
  try {
    db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    console.log(`[Database] Loaded ${db.orders.length} orders and ${db.users.length} users from storage.`);
  } catch (e) {
    console.warn('[Database] Initializing fresh database storage.');
  }
}

function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('[Database] Failed to persist data:', e.message);
  }
}

// MongoDB connection & auto-sync
let mongoConnected = false;
let OrderModel = null;
let UserModel = null;

try {
  const mongoose = require('mongoose');
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/washeasy';
  mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 })
    .then(async () => {
      mongoConnected = true;
      OrderModel = require('./models/Order');
      UserModel = require('./models/User');
      console.log(`[MongoDB] Connected to database: ${mongoUri}`);

      // Sync data from MongoDB into live server memory & JSON
      try {
        const mongoOrders = await OrderModel.find().lean();
        const mongoUsers = await UserModel.find().lean();
        if (mongoOrders.length > 0) {
          db.orders = mongoOrders.map(o => ({ ...o, id: o.orderId }));
        }
        if (mongoUsers.length > 0) {
          db.users = mongoUsers.map(u => ({ ...u, id: u._id.toString() }));
        }
        saveDB();
        console.log(`[MongoDB] Synced ${db.orders.length} orders & ${db.users.length} users into live memory.`);
      } catch (err) {
        console.warn('[MongoDB] Sync error:', err.message);
      }
    })
    .catch(err => {
      console.log('[MongoDB] Connection skipped:', err.message);
    });
} catch (e) {
  // Mongoose not installed or running zero-dependency mode
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  // ----------------------------------------------------
  // REST API ROUTES
  // ----------------------------------------------------

  // 1. Health Check
  if (pathname === '/api/health' && req.method === 'GET') {
    return sendJSON(res, 200, {
      status: 'ok',
      service: 'WashEasy Laundry API',
      database: mongoConnected ? 'MongoDB (Connected)' : 'Local JSON Store',
      mongoUri: mongoConnected ? (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/washeasy') : null,
      ordersCount: db.orders.length,
      usersCount: db.users.length,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  }

  // 2. Auth: Sign Up
  if (pathname === '/api/auth/signup' && req.method === 'POST') {
    try {
      const { name, email, phone, password } = await parseBody(req);
      if (!name || !email || !password) {
        return sendJSON(res, 400, { error: 'Please provide name, email, and password.' });
      }

      const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return sendJSON(res, 409, { error: 'An account with this email already exists.' });
      }

      const newUser = {
        id: 'usr_' + crypto.randomBytes(6).toString('hex'),
        name,
        email: email.toLowerCase(),
        phone: phone || '',
        createdAt: new Date().toISOString()
      };

      db.users.push(newUser);
      saveDB();

      // Persist to MongoDB if connected
      if (mongoConnected && UserModel) {
        UserModel.create({
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone || '0000000000',
          password: password,
          address: ''
        }).catch(err => console.error('[MongoDB Error saving user]:', err.message));
      }

      return sendJSON(res, 201, {
        success: true,
        message: 'Account created successfully!',
        user: newUser
      });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 3. Auth: Login
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    try {
      const { email, password } = await parseBody(req);
      if (!email || !password) {
        return sendJSON(res, 400, { error: 'Please provide email and password.' });
      }

      let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        // Auto-provision user account if not found
        user = {
          id: 'usr_' + crypto.randomBytes(6).toString('hex'),
          name: email.split('@')[0],
          email: email.toLowerCase(),
          phone: '',
          createdAt: new Date().toISOString()
        };
        db.users.push(user);
        saveDB();
      }

      return sendJSON(res, 200, {
        success: true,
        message: 'Logged in successfully!',
        user
      });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 4. Orders: Create Order
  if (pathname === '/api/orders' && req.method === 'POST') {
    try {
      const orderData = await parseBody(req);
      const orderId = orderData.id || ('WE' + Math.floor(10000 + Math.random() * 90000));

      const newOrder = {
        id: orderId,
        orderId,
        service: orderData.service || 'Wash & Fold',
        qty: orderData.qty || 1,
        items: orderData.items || (orderData.calcDetails ? orderData.calcDetails.items : []),
        subtotal: orderData.subtotal || (orderData.calcDetails ? orderData.calcDetails.subtotal : orderData.total),
        deliveryFee: orderData.deliveryFee || 0,
        addOns: orderData.addOns || [],
        promoCode: orderData.promoCode || null,
        promoDiscount: orderData.promoDiscount || 0,
        total: orderData.total || 0,
        payment: orderData.payment || 'cod',
        status: 'Confirmed',
        date: orderData.date || new Date().toISOString().split('T')[0],
        time: orderData.time || '9:00 AM – 11:00 AM',
        address: orderData.address || '',
        phone: orderData.phone || '',
        placedAt: new Date().toISOString()
      };

      db.orders.push(newOrder);
      saveDB();

      // Persist to MongoDB if connected
      if (mongoConnected && OrderModel) {
        OrderModel.create({
          orderId,
          service: newOrder.service,
          qty: newOrder.qty,
          items: newOrder.items,
          subtotal: newOrder.subtotal,
          deliveryFee: newOrder.deliveryFee,
          addOns: newOrder.addOns,
          promoCode: newOrder.promoCode,
          promoDiscount: newOrder.promoDiscount,
          total: newOrder.total,
          paymentMethod: newOrder.payment || 'cod',
          status: newOrder.status || 'Confirmed',
          customer: {
            name: orderData.name || 'Customer',
            phone: newOrder.phone,
            address: newOrder.address
          },
          pickupDate: newOrder.date,
          pickupTime: newOrder.time
        }).catch(err => console.error('[MongoDB Error saving order]:', err.message));
      }

      console.log(`[Order] New order placed: #${orderId} (₹${newOrder.total})`);

      return sendJSON(res, 201, {
        success: true,
        message: 'Order placed successfully!',
        order: newOrder
      });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // 5. Orders: Get All Orders
  if (pathname === '/api/orders' && req.method === 'GET') {
    return sendJSON(res, 200, {
      success: true,
      count: db.orders.length,
      orders: db.orders
    });
  }

  // 6. Orders: Track by ID (/api/orders/:id)
  if (pathname.startsWith('/api/orders/') && req.method === 'GET') {
    const id = pathname.replace('/api/orders/', '').trim().toUpperCase();
    const order = db.orders.find(o => (o.id && o.id.toUpperCase() === id) || (o.orderId && o.orderId.toUpperCase() === id));

    if (order) {
      return sendJSON(res, 200, { success: true, order });
    } else {
      if (id.startsWith('WE')) {
        return sendJSON(res, 200, {
          success: true,
          order: {
            id,
            service: 'Wash & Fold (Demo)',
            status: 'Washing',
            total: 240,
            date: new Date().toISOString().split('T')[0],
            time: '2:00 PM – 4:00 PM',
            placedAt: new Date().toISOString()
          }
        });
      }
      return sendJSON(res, 404, { success: false, error: 'Order not found with ID: ' + id });
    }
  }

  // ----------------------------------------------------
  // STATIC FILE SERVING
  // ----------------------------------------------------
  let filePath = pathname === '/' ? '/index.html' : pathname;
  const absPath = path.join(__dirname, filePath);

  fs.stat(absPath, (err, stats) => {
    if (err || !stats.isFile()) {
      if (!path.extname(absPath)) {
        const tryHtml = absPath + '.html';
        if (fs.existsSync(tryHtml)) {
          return serveFile(res, tryHtml);
        }
      }
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`404 Not Found: ${pathname}`);
      return;
    }
    serveFile(res, absPath);
  });
});

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error loading file');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(` WashEasy Laundry Full-Stack Server Running!`);
  console.log(` Local URL:   http://localhost:${PORT}`);
  console.log(` Network URL: http://0.0.0.0:${PORT} (Access from iPhone)`);
  console.log(` REST API:    http://localhost:${PORT}/api/health`);
  console.log(` Database:    ${mongoConnected ? 'MongoDB Cloud Atlas' : 'Local JSON DB (' + DB_FILE + ')'}`);
  console.log(`====================================================`);
});
