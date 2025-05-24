const CustomerOrder = require('../models/customerorder');
const Customer = require("../models/customer");
const Cart = require("../models/customercart"); // Assuming you have a Cart model
const Packages = require("../models/subcategory");
const mongoose = require('mongoose');

// Create Order
exports.createOrder = async (req, res) => {
  try {
    const {
      customerId,
      billingDetails,
      paymentMethod,
      cartItems,
      totalAmount,
      note,
      deliveryDate
    } = req.body;

    console.log("Received order data:", req.body);

    // Validate required fields
    if (!customerId || !billingDetails || !cartItems || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      console.log("Invalid customer ID format:", customerId);
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID format"
      });
    }

    console.log("Looking for customer with ID:", customerId);

    // Get customer details with better error handling
    let customer;
    try {
      customer = await Customer.findById(customerId);
      console.log("Customer found:", customer ? "Yes" : "No");
      
      if (!customer) {
        // Try to find customer by alternative fields if needed
        console.log("Attempting to find customer by email:", billingDetails.email);
        customer = await Customer.findOne({ email: billingDetails.email });
        
        if (!customer) {
          return res.status(404).json({
            success: false,
            message: "Customer not found. Please ensure you are logged in properly."
          });
        }
        console.log("Customer found by email:", customer._id);
      }
    } catch (dbError) {
      console.error("Database error when finding customer:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database error when finding customer"
      });
    }

    // Generate unique order ID
    const generateOrderId = () => {
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substr(2, 5);
      return `ORD-${timestamp}-${randomStr}`.toUpperCase();
    };

    let orderId;
    let isUnique = false;
    
    // Ensure unique order ID
    while (!isUnique) {
      orderId = generateOrderId();
      const existingOrder = await CustomerOrder.findOne({ orderId });
      if (!existingOrder) {
        isUnique = true;
      }
    }

    // Prepare package details for order
    const packageDetails = [];
    const packageIds = [];
    
    console.log("Processing cart items:", cartItems);

    for (const item of cartItems) {
      if (item.packageId) {
        // Validate package ObjectId format
        const packageId = item.packageId._id || item.packageId;
        
        if (!mongoose.Types.ObjectId.isValid(packageId)) {
          console.log("Invalid package ID format:", packageId);
          continue;
        }

        // For customer cart items
        const packageInfo = await Packages.findById(packageId);
        if (packageInfo) {
          packageDetails.push({
            packageDetails: {
              _id: packageInfo._id.toString(),
              mainCategory: packageInfo.mainCategory,
              price: packageInfo.price,
              image: packageInfo.image,
              packagename: packageInfo.packagename,
              quantity: item.quantity
            }
          });
          packageIds.push(packageInfo._id);
          console.log("Added package:", packageInfo.packagename);
        } else {
          console.log("Package not found:", packageId);
        }
      } else {
        // For guest cart items
        packageDetails.push({
          packageDetails: {
            _id: item._id || item.id,
            mainCategory: item.mainCategory,
            price: item.price,
            image: item.image,
            packagename: item.packagename,
            quantity: item.quantity
          }
        });
        
        // Find package by name or other identifier
        const packageInfo = await Packages.findOne({ packagename: item.packagename });
        if (packageInfo) {
          packageIds.push(packageInfo._id);
        }
      }
    }

    if (packageDetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid packages found in cart"
      });
    }

    // Calculate balance amount based on payment method
    let paidAmount = 0;
    let balanceAmount = totalAmount;
    let paymentStatus = "Unpaid";

    if (paymentMethod === "COD") {
      paymentStatus = "Unpaid";
      balanceAmount = totalAmount;
    } else if (paymentMethod === "Razorpay") {
      // For now, assuming payment will be processed separately
      paymentStatus = "Unpaid";
      balanceAmount = totalAmount;
    }

    // Create order object
    const orderData = {
      orderId,
      totalAmount,
      customerId: customer._id, // Use the found customer's ID
      customerName: billingDetails.firstName,
      email: billingDetails.email,
      phone: billingDetails.phone,
      address: billingDetails.address,
      address1: billingDetails.address1 || "",
      country: billingDetails.country,
      state: billingDetails.state,
      city: billingDetails.city,
      Pincode: billingDetails.pincode || "",
      paymentMethod: paymentMethod === "cash" ? "COD" : paymentMethod,
      paidAmount,
      balanceAmount,
      paymentStatus,
      orderDate: new Date(),
      deliveryDate: deliveryDate || null,
      note: note || "",
      package: packageDetails,
      packageId: packageIds
    };

    console.log("Creating order with data:", orderData);

    // Create the order
    const newOrder = new CustomerOrder(orderData);
    const savedOrder = await newOrder.save();

    console.log("Order saved successfully:", savedOrder.orderId);

    // Clear customer's cart after successful order
    if (customer._id) {
      try {
        const deletedCount = await Cart.deleteMany({ customerId: customer._id });
        console.log("Cleared cart items:", deletedCount.deletedCount);
      } catch (cartError) {
        console.error("Error clearing cart:", cartError);
        // Don't fail the order if cart clearing fails
      }
    }

    // Populate the order with package details
    const populatedOrder = await CustomerOrder.findById(savedOrder._id)
      .populate('customerId', 'name email phone')
      .populate('packageId', 'packagename price image mainCategory');

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: populatedOrder
    });

  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message
    });
  }
};




// Generate unique orderId starting with CUT-ORID000001 format
const generateOrderId = async () => {
    const lastOrder = await CustomerOrder.findOne().sort({ _id: -1 }).limit(1);
    let lastOrderId = lastOrder
      ? parseInt(lastOrder.orderId.replace("CUT-ORID", ""))
      : 0;
    lastOrderId++;
    return `CUT-ORID${String(lastOrderId).padStart(7, "0")}`;
  };
  exports.create = async (req, res) => {
    try {
      const orderId = await generateOrderId();
      const {
        totalAmount,
        customerName,
        deliveryDate,
        email,
        phone,
        address,
        shopName,
        paymentMethod,
        paymentStatus,
        deliveryStatus,
        orderDate,
        note,
        Pincode,
        products,
        customerId,
        gift,
        giftMessage
      } = req.body;
  
      if (!customerId) {
        return res.status(400).json({ message: "Customer ID is required." });
      }
  
      // Create a new order
      const newOrder = new CustomerOrder({
        customerId,
        orderId,
        totalAmount,
        customerName,
        email,
        phone,
        address,
        shopName,
        paymentMethod,
        paymentStatus,
        deliveryStatus,
        orderDate,
        deliveryDate,
        note,
        Pincode,
        products,
        gift,
        giftMessage
      });
  
      await newOrder.save();
      return res.status(201).json({ message: "Order created successfully", order: newOrder });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error", error });
    }
  };
  

  //get customer orders by customerId
  exports.getOrderDetailsByCustomer = async (req, res) => {
    try {
      const customerId = req.params.customerId;
      
      // Fetch the orders and populate the products
      const orders = await CustomerOrder.find({ customerId })
        .populate('products'); 
  
      if (orders.length === 0) {
        return res.status(404).json({ message: "No orders found for this customer" });
      }
  
      res.status(200).json({ orders });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };

  //get all customer order
  exports.getAll = async (req, res) => {
    try {
      const orders = await CustomerOrder.find();
      res.status(200).json({ orders });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };

  //get customerorder by id
  exports.get = async (req, res) => {
    try { 
      const { id } = req.params;
      const order = await CustomerOrder.findById(id);
      res.status(200).json({ order });
  }
    catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  };

//delete customerorder by id
exports.delete =async (req, res) => {
  try {
    const { id } = req.params;
    const order = await CustomerOrder.findByIdAndDelete(id);
    res.status(200).json({ message: "Order deleted successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

