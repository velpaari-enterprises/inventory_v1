const Buyer = require('../models/Buyer');

// Get all buyers
exports.getAllBuyers = async (req, res) => {
  try {
    const buyers = await Buyer.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(buyers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get buyer by ID
exports.getBuyerById = async (req, res) => {
  try {
    const buyer = await Buyer.findById(req.params.id);
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    res.json(buyer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new buyer
exports.createBuyer = async (req, res) => {
  try {
    const buyer = new Buyer(req.body);
    const savedBuyer = await buyer.save();
    res.status(201).json(savedBuyer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update buyer
exports.updateBuyer = async (req, res) => {
  try {
    const buyer = await Buyer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    res.json(buyer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete buyer (soft delete)
exports.deleteBuyer = async (req, res) => {
  try {
    const buyer = await Buyer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!buyer) {
      return res.status(404).json({ message: 'Buyer not found' });
    }
    res.json({ message: 'Buyer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};