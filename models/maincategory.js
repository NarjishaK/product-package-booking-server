const mongoose = require('mongoose');

const maincategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    updateperson:{
        type:String
    },
    role:{
        type:String
    }
});

module.exports = mongoose.model('MainCategory', maincategorySchema)