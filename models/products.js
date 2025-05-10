const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  videoLink: {
    type: [String], 
    default: [], 
  },
      mainCategory: { type: String, required: true },
      meterial: { type: String, required: true },
      outermeterial: { type: String, },
      discount: { type: Number, },
      gst: { type: Number,  },
      brand: { type: String, required: true },
      height: { type: String, },
      length: { type: String, },
      weight: { type: String,  },
      warrenty: { type: String,  },
      compartment: { type: String, },
      rating: { type: Number, },
      coverimage: { type: String, required: true },
      subCategory: { type: String, required: true },
      price: { type: Number, required: true },
      productId: { type: String, required: true , unique: true,},
      modelNo: { type: String, required: true },
      date: { type: Date, required: true },
      totalStock: { type: Number},
      returnpolicy: { type: String,  },
      warehouse: { type: String },
      tag:{ type: String },
      title: { type: String, required: true },
      description: { type: String, required: true },
      about: { type: String},
      images: { type: [String], required: true }, 
      color: { type: String, required: true },
      sizes: [
        {
          size: { type: String, required: true },
          stock: { type: Number, default: 0 },
          selected: { type: Boolean, default: false },
        },
      ],
    }, { timestamps: true });

module.exports = mongoose.model("Product", productSchema)
