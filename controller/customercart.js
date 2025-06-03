const CustomerCart = require("../models/customercart");
const asyncHandler = require("express-async-handler");

//customer cart  routes
exports.create = asyncHandler(async (req, res) => {
    const { customerId, packageId, quantity } = req.body;
    
    if (!customerId || !packageId) {
        return res.status(400).json({ message: "Please add all fields" });
    }
    
    try {
        // Check if item already exists in cart
        const existingCartItem = await CustomerCart.findOne({ 
            customerId, 
            packageId 
        });
        
        if (existingCartItem) {
            // Update quantity if item exists
            existingCartItem.quantity += quantity || 1;
            await existingCartItem.save();
            return res.status(200).json(existingCartItem);
        }
        
        // Create new cart item if it doesn't exist
        const customerCart = await CustomerCart.create({
            customerId,
            packageId,
            quantity: quantity || 1
        });
        
        res.status(201).json(customerCart);
    } catch (error) {
        res.status(500).json({ 
            message: "Failed to add item to cart", 
            error: error.message 
        });
    }
});


exports.getByCustomerId = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    
    if (!customerId) {
        return res.status(400).json({ message: "Customer ID is required" });
    }
    
    const cartItems = await CustomerCart.find({ customerId })
        .populate('packageId', 'packagename price image description')
        .sort({ createdAt: -1 });
    
    res.status(200).json(cartItems);
});


// Update cart item quantity
exports.updateQuantity = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Quantity must be 1 or greater" });
    }
    
    const cartItem = await CustomerCart.findById(id);
    
    if (!cartItem) {
        return res.status(404).json({ message: "Cart item not found" });
    }
    
    cartItem.quantity = quantity;
    await cartItem.save();
    
    res.status(200).json(cartItem);
});

// Delete cart item
exports.delete = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const cartItem = await CustomerCart.findByIdAndDelete(id);

  if (!cartItem) {
    return res.status(404).json({ message: "Cart item not found" });
  }

  res.status(200).json({ message: "Item removed from cart" });
});


// Clear customer cart (remove all items)
exports.clearCart = asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    
    if (!customerId) {
        return res.status(400).json({ message: "Customer ID is required" });
    }
    
    await CustomerCart.deleteMany({ customerId });
    
    res.status(200).json({ message: "Cart cleared successfully" });
});