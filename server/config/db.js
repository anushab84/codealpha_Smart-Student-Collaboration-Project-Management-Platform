const mongoose = require('mongoose');

/**
 * Connects to MongoDB Atlas / Database using Mongoose.
 */
const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('[Database Error] MONGO_URI is not defined in environment variables (.env)');
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[Database] MongoDB Connected Successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`[Database Error] MongoDB Connection Failed: ${error.message}`);
    console.warn('[Database Warning] Please check your MONGO_URI in server/.env file.');
    return false;
  }
};

module.exports = connectDB;
