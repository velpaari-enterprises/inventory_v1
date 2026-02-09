const express = require('express');
const router = express.Router();
const {
  getAllReturns,
  getReturnById,
  getReturnsByCategory,
  createReturn,
  updateReturn,
  deleteReturn
} = require('../controllers/returnController');

// GET /api/returns - Get all returns
router.get('/', getAllReturns);

// GET /api/returns/category/:category - Get returns by category (RTO or RPU)
router.get('/category/:category', getReturnsByCategory);

// GET /api/returns/:id - Get return by ID
router.get('/:id', getReturnById);

// POST /api/returns - Create new return
router.post('/', createReturn);

// PUT /api/returns/:id - Update return
router.put('/:id', updateReturn);

// DELETE /api/returns/:id - Delete return
router.delete('/:id', deleteReturn);

module.exports = router;