const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongod = null;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Connection Error ❌", error.message);
    console.log("⚠️ Falling back to an in-memory local MongoDB database so the app can run...");
    
    try {
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`✅ In-Memory MongoDB Connected successfully! (${conn.connection.host})`);
      console.log(`⚠️ NOTE: Data saved in this session will be lost when the server restarts.`);
    } catch (fallbackError) {
      console.error("In-Memory MongoDB Connection Error ❌", fallbackError.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;