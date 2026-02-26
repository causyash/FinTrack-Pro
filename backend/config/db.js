const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Get MongoDB URI from environment
        let mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
        
        if (!mongoURI) {
            console.error('Error: MONGO_URI is not defined in environment variables');
            process.exit(1);
        }

        // Connection options for MongoDB Atlas
        const options = {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4 // Force IPv4
        };

        const conn = await mongoose.connect(mongoURI, options);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        console.error('\nPossible fixes:');
        console.error('1. Check your internet connection');
        console.error('2. Whitelist your IP in MongoDB Atlas (Network Access)');
        console.error('3. Verify your MONGO_URI in .env file');
        console.error('4. Ensure MongoDB Atlas cluster is active (not paused)');
        process.exit(1);
    }
};

module.exports = connectDB;
