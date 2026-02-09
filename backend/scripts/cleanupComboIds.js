const mongoose = require('mongoose');
const Combo = require('../models/Combo');

const cleanupComboIds = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory');
    
    console.log('Connected to MongoDB');
    
    // Find all combos that don't have comboId or have null comboId
    const combosWithoutId = await Combo.find({
      $or: [
        { comboId: null },
        { comboId: { $exists: false } }
      ]
    });
    
    console.log(`Found ${combosWithoutId.length} combos without comboId`);
    
    // Update each combo with a unique comboId
    for (let i = 0; i < combosWithoutId.length; i++) {
      const combo = combosWithoutId[i];
      const timestamp = Date.now();
      const uniqueId = `COMBO-${timestamp}-${i + 1}`;
      
      await Combo.findByIdAndUpdate(combo._id, {
        comboId: uniqueId
      });
      
      console.log(`Updated combo ${combo._id} with comboId: ${uniqueId}`);
    }
    
    console.log('Cleanup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

cleanupComboIds();