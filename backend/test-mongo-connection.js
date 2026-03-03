const { MongoClient } = require('mongodb');
// require('dotenv') removed

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://fieldservice-user:app2field@fieldservice-cluster.76mgxvb.mongodb.net/?appName=fieldservice-cluster&retryWrites=true&w=majority';
const DB_NAME = process.env.DB_NAME || 'fieldservice';

async function testConnection() {
    console.log(`Attempting to connect to MongoDB with URI: ${MONGO_URI}`);
    try {
        const client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        console.log('Successfully connected to MongoDB!');
        const db = client.db(DB_NAME);
        const collections = await db.listCollections().toArray();
        console.log(`Available collections in ${DB_NAME}:`, collections.map(c => c.name));
        await client.close();
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err.message);
    }
}

testConnection();
