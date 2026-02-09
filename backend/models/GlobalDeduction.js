const mongoose = require('mongoose');

const GlobalDeductionSchema = new mongoose.Schema({
    reason: {
        type: String,
        required: true,
        trim: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('GlobalDeduction', GlobalDeductionSchema);
