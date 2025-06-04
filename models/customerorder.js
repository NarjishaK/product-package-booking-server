const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const customerorderSchema = new Schema({
    orderId: {
        type: String,
        unique: true,
        required: true,
      },
      totalAmount: {
        type: Number,
        required: true,
      },
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
      },
      customerName: String,
      email: String,
      phone: String,
      address: String,
      address1: String,
      country: String,
      state: String,
      city: String,
      Pincode: String,
      orderStatus: {
        type: String,
        enum: ["Packing", "Delivered", "Cancelled","Returned"],
        default: "Packing",
      },
      paymentMethod: {
        type: String,
        enum: ["COD", "UPI","Razorpay"],
        default: "COD",
      },
      paidAmount: {
        type: Number,
        default: 0,
      },
      balanceAmount: {
        type: Number,
        default: 0,
      },
      paymentStatus: {
        type: String,
        enum: ["Unpaid", "Paid", "Refund", "Partially Paid"],
        default: "Unpaid",
      },
      orderDate: {
        type: Date,
      },
      note: {
        type: String,
      },
      package: [{
        packageDetails: {
          _id: String,
          category: {type: mongoose.Schema.Types.ObjectId, ref: "MainCategory"},
          price: Number,
          image: String,
          packagename: String,
          quantity: Number,
           deliveryStatus: {
        type: String,
        enum: ["Out for delivery", "Claim", "Cancelled", "On transist", "Pending","Returned"],
        default: "Pending",
      },
      deliveryDate: {
        type: String,
      },
        }
      }],
      packageId:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Packages",
      }]
    });

module.exports = mongoose.model("CustomerOrder", customerorderSchema);
