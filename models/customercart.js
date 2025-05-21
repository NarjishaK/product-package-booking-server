const mongoose = require('mongoose');

const customerCartSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    packageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Packages',
        required: true
    },
    quantity: {
        type: Number,
    }
});

// Compound index to prevent duplicate items in cart
customerCartSchema.index({ customerId: 1, packageId: 1 }, { unique: true });


module.exports = mongoose.model('CustomerCart', customerCartSchema)