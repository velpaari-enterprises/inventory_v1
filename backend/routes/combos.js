const express = require('express');
const router = express.Router();
const comboController = require('../controllers/comboController');

// GET /api/combos - Get all combos
router.get('/', comboController.getAllCombos);

// GET /api/combos/unmapped - Get unmapped combos (must be before /:id route)
router.get('/unmapped', comboController.getUnmappedCombos);

// GET /api/combos/barcode/:barcode - Get combo by barcode
router.get('/barcode/:barcode', comboController.getComboByBarcode);

// GET /api/combos/:id - Get combo by ID
router.get('/:id', comboController.getComboById);

// POST /api/combos - Create new combo
router.post('/', comboController.upload.single('image'), comboController.createCombo);

// PUT /api/combos/:id - Update combo
router.put('/:id', comboController.upload.single('image'), comboController.updateCombo);

// DELETE /api/combos/:id - Delete combo (soft delete)
router.delete('/:id', comboController.deleteCombo);

// POST /api/combos/:id/add-product - Add product to combo
router.post('/:id/add-product', comboController.addProductToCombo);

module.exports = router;