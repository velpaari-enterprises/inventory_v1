const express = require('express');
const router = express.Router();
const {
  getAllBuyers,
  getBuyerById,
  createBuyer,
  updateBuyer,
  deleteBuyer
} = require('../controllers/buyerController');

router.get('/', getAllBuyers);
router.get('/:id', getBuyerById);
router.post('/', createBuyer);
router.put('/:id', updateBuyer);
router.delete('/:id', deleteBuyer);

module.exports = router;