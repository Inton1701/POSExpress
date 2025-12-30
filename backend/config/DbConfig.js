
const mongoose = require('mongoose');
// database connection
const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database connected: ", connect.connection.host, connect.connection.name);
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); 
  }
};
module.exports = connectDB;
