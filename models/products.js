const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  videoLink: {
    type: [String], 
    default: [], 
  },
      mainCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'MainCategory', required: true },
      gst: { type: Number,  },
      coverimage: { type: String},
      price: { type: Number, required: true },
      productId: { type: String, required: true , unique: true,},
      date: { type: Date, required: true },
      totalStock: { type: Number},
      tag:{ type: String },
      title: { type: String, required: true },
      description: { type: String, required: true },
      about: { type: String},
      images: { type: [String], required: true }, 
    }, { timestamps: true });

module.exports = mongoose.model("Product", productSchema)
