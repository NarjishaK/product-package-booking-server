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
    fromDate: {
        type: Date,
    },
    toDate: {
        type: Date,
    }
});

module.exports = mongoose.model('Packages', packageSchema)