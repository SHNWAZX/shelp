const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB error:', error.message);
    process.exit(1);
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.log('⚠️ MongoDB disconnected — reconnecting...');
  setTimeout(connectDB, 5000);
});

module.exports = connectDB;
