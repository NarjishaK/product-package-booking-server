const mongoose = require('mongoose');
const { image } = require('pdfkit');

const packageSchema = new mongoose.Schema({
    packagename: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MainCategory',
        required: true
    },
    price: {
        type: Number,
    },
    image: {
        type: String,
    },
    fromDate: {
        type: Date,
    },
    toDate: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Packages', packageSchema)