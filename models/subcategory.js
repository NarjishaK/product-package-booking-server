const mongoose = require('mongoose');

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
    },
    updatepersone: {
        type: String,
    },
    role: {
        type: String,
    }
});

module.exports = mongoose.model('Packages', packageSchema)