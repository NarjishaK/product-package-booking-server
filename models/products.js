const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
      mainCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'MainCategory', required: true },
      coverimage: { type: String},
      productId: { type: String, required: true , unique: true,},
      tag:{ type: String },
      title: { type: String, required: true },
      description: { type: String},
      about: { type: String},
    }, { timestamps: true });

module.exports = mongoose.model("Product", productSchema)
