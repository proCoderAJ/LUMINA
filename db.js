const mongoose = require('mongoose');
require('dotenv').config();  // Load .env file

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI;  // Get MongoDB URI from .env
        await mongoose.connect(mongoURI);  // No need for useNewUrlParser and useUnifiedTopology
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;
