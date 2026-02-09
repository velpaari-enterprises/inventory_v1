const express = require('express');
const router = express.Router();
const GlobalDeduction = require('../models/GlobalDeduction');

// GET all deductions
router.get('/', async (req, res) => {
    try {
        const deductions = await GlobalDeduction.find().sort({ date: -1 });
        res.json(deductions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// CREATE new deduction
router.post('/', async (req, res) => {
    try {
        const { reason, amount } = req.body;
        const deduction = new GlobalDeduction({
            reason,
            amount: Number(amount)
        });
        const newDeduction = await deduction.save();
        res.status(201).json(newDeduction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE deduction
router.delete('/:id', async (req, res) => {
    try {
        await GlobalDeduction.findByIdAndDelete(req.params.id);
        res.json({ message: 'Deduction deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
