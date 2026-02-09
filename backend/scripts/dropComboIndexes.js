const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory';

async function dropComboIndexes() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('combos');

    // Get all indexes
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Drop the problematic comboId index if it exists
    try {
      await collection.dropIndex('comboId_1');
      console.log('Successfully dropped comboId_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('comboId_1 index does not exist - this is fine');
      } else {
        console.log('Error dropping comboId_1 index:', error.message);
      }
    }

    // Drop all indexes except _id (be careful with this)
    try {
      await collection.dropIndexes();
      console.log('Dropped all indexes except _id');
    } catch (error) {
      console.log('Error dropping indexes:', error.message);
    }

    // Recreate the correct indexes
    try {
      await collection.createIndex({ barcode: 1 }, { unique: true });
      console.log('Created barcode index');
      
      await collection.createIndex({ name: 1 }, { unique: true });
      console.log('Created name index');
    } catch (error) {
      console.log('Error creating indexes:', error.message);
    }

    console.log('Index cleanup completed');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
}

dropComboIndexes();