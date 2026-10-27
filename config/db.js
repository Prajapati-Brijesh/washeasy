/**
 * WashEasy - MongoDB Connection Configuration
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/washeasy';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[MongoDB] Connection failed: ${error.message}`);
    console.log('[Database] Falling back to persistent local JSON store.');
    return false;
  }
};

module.exports = connectDB;

