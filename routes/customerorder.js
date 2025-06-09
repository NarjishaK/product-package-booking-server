var express = require('express');
var router = express.Router();
const Controller = require("../controller/customerorder")
const Order = require('../models/customerorder');
const Product =require('../models/products');

router.post('/create', Controller.createOrder);
router.get("/bestselling-packages",Controller.getBestSellingPackages);
router.get("/:customerId",Controller.getOrderDetailsByCustomer)
router.get("/",Controller.getAll)
router.get("/:id",Controller.get)
router.delete("/:id",Controller.delete)
router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updatedOrder = await Order.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true, 
      });
  
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
  
      res.status(200).json({ order: updatedOrder });
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Internal Server Error", error });
    }
  });
  
  
// Route to update order delivery status and deduct stocks
// router.put('/:id/delivered', async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id);
//     if (!order) {
//       return res.status(404).json({ message: 'Order not found' });
//     }

//     if (!order.package || order.package.length === 0) {
//       return res.status(400).json({ message: 'No products found in the order' });
//     }

//     // Update deliveryStatus for all packages in the order
//     order.package.forEach(pkg => {
//       if (pkg.packageDetails) {
//         pkg.packageDetails.deliveryStatus = 'Claim';
//       }
//     });

//     // Update delivery date
//     order.deliveryDate = new Date().toISOString();
    
//     await order.save();

//     res.status(200).json({ 
//       message: 'Order marked as delivered and stock updated', 
//       order 
//     });
//   } catch (error) {
//     console.error("Error updating order:", error);
//     res.status(500).json({ 
//       message: 'Error updating order', 
//       error: error.message 
//     });
//   }
// });
// Route to handle order return and restore stock
router.put('/:id/return', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.deliveryStatus !== 'Delivered') {
            return res.status(400).json({ message: 'Order must be delivered before it can be returned' });
        }

        if (order.return) {
            return res.status(400).json({ message: 'Order has already been returned' });
        }
        // Update order status
        order.return = true;
        order.deliveryStatus = 'Returned';
        await order.save();

        res.status(200).json({ message: 'Order returned and stock restored', order });
    } catch (error) {
        console.error("Error returning order:", error);
        res.status(500).json({ message: 'Error returning order', error: error.message });
    }
});
  


router.put('/:id/delivered/:packageIndex', async (req, res) => {
  try {
    const { id, packageIndex } = req.params;
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.package || order.package.length === 0) {
      return res.status(400).json({ message: 'No packages found in the order' });
    }

    const pkgIndex = parseInt(packageIndex);
    if (pkgIndex < 0 || pkgIndex >= order.package.length) {
      return res.status(400).json({ message: 'Invalid package index' });
    }

    // Update specific package deliveryStatus
    order.package[pkgIndex].packageDetails.deliveryStatus = 'Claim';
    
    // Check if all packages are claimed to update overall delivery date
    const allClaimed = order.package.every(pkg => 
      pkg.packageDetails.deliveryStatus === 'Claim'
    );
    order.package[pkgIndex].packageDetails.deliveryDate= new Date().toISOString();
//    if (allClaimed) {
//       const currentDate = new Date().toISOString();
//       order.package.forEach(pkg => {
//         pkg.packageDetails.deliveryDate = currentDate;
//       });
//     }
    
    await order.save();

    res.status(200).json({ 
      message: 'Package marked as claimed successfully', 
      order 
    });
  } catch (error) {
    console.error("Error updating package:", error);
    res.status(500).json({ 
      message: 'Error updating package', 
      error: error.message 
    });
  }
});













// Add these routes to your existing customer order router

const nodemailer = require('nodemailer');
const crypto = require('crypto');

// In-memory storage for OTPs (you can use Redis or database for production)
const otpStorage = new Map();

// Email configuration (replace with your email service credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL, // your email
    pass: process.env.PASSWORD  // your email password or app password
  }
});

// Alternative configuration for other email services
/*
const transporter = nodemailer.createTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
*/

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP Route
router.post('/send-otp', async (req, res) => {
  try {
    const { orderId, email, customerName } = req.body;

    if (!orderId || !email) {
      return res.status(400).json({ 
        message: 'Order ID and email are required' 
      });
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpKey = `${orderId}_${Date.now()}`;
    
    // Store OTP with expiration (5 minutes)
    otpStorage.set(otpKey, {
      otp: otp,
      orderId: orderId,
      email: email,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
    });

    // Store the current OTP key in the order for reference
    otpStorage.set(`current_${orderId}`, otpKey);

    // Email content
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'OTP for Package Claim Verification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Package Claim Verification</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Dear ${customerName || 'Customer'},</p>
            <p>Your package claim request has been initiated for Order ID: <strong>${order.orderId}</strong></p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #007bff; color: white; padding: 15px; border-radius: 5px; display: inline-block;">
                <h3 style="margin: 0; font-size: 24px; letter-spacing: 3px;">${otp}</h3>
              </div>
            </div>
            <p><strong>This OTP is valid for 5 minutes only.</strong></p>
            <p>If you did not request this, please ignore this email.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              This is an automated email. Please do not reply to this email.
            </p>
          </div>
        </div>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ 
      message: 'OTP sent successfully',
      otpKey: otpKey // Don't send this in production, just for reference
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ 
      message: 'Failed to send OTP', 
      error: error.message 
    });
  }
});

// Verify OTP and Update Delivery Status Route
router.post('/verify-otp', async (req, res) => {
  try {
    const { orderId, otp, packageIndex } = req.body;

    if (!orderId || !otp || packageIndex === undefined) {
      return res.status(400).json({ 
        message: 'Order ID, OTP, and package index are required' 
      });
    }

    // Get current OTP key for this order
    const currentOtpKey = otpStorage.get(`current_${orderId}`);
    if (!currentOtpKey) {
      return res.status(400).json({ 
        message: 'No OTP found for this order. Please request a new OTP.' 
      });
    }

    // Get OTP data
    const otpData = otpStorage.get(currentOtpKey);
    if (!otpData) {
      return res.status(400).json({ 
        message: 'OTP not found or expired. Please request a new OTP.' 
      });
    }

    // Check if OTP is expired
    if (new Date() > otpData.expiresAt) {
      // Clean up expired OTP
      otpStorage.delete(currentOtpKey);
      otpStorage.delete(`current_${orderId}`);
      return res.status(400).json({ 
        message: 'OTP has expired. Please request a new OTP.' 
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({ 
        message: 'Invalid OTP. Please check and try again.' 
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if package exists
    if (!order.package || !order.package[packageIndex]) {
      return res.status(400).json({ 
        message: 'Package not found in the order' 
      });
    }

    // Update delivery status for the specific package
    if (order.package[packageIndex].packageDetails) {
      order.package[packageIndex].packageDetails.deliveryStatus = 'Claim';
      order.package[packageIndex].packageDetails.deliveryDate = new Date().toISOString();
    }

    // Save the updated order
    await order.save();

    res.status(200).json({ 
      message: 'Package marked as claimed successfully', 
      order 
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ 
      message: 'Failed to verify OTP', 
      error: error.message 
    });
  }
});
module.exports = router;
