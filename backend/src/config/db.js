/*const mongoose = require('mongoose');

const connectDB = async () => {
  try {
  
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
  console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;*/
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    console.error(error.cause);
    process.exit(1);
  }
};

module.exports = connectDB;