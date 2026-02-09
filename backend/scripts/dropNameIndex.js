const mongoose = require('mongoose');
require('dotenv').config();

async function dropNameIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('combos');
    
    // Drop the unique index on name field
    await collection.dropIndex('name_1');
    console.log('Successfully dropped name_1 index');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

dropNameIndex();