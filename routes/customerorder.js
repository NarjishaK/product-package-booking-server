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
router.put('/:id/delivered', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (!order.package || order.package.length === 0) {
            return res.status(400).json({ message: 'No products found in the order' });
        }

        // Update order status
        order.deliveryStatus = 'Delivered';
        order.deliveryDate = new Date().toISOString();
        await order.save();

        res.status(200).json({ message: 'Order marked as delivered and stock updated', order });
    } catch (error) {
        console.error("Error updating order:", error);
        res.status(500).json({ message: 'Error updating order', error: error.message });
    }
});
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
  
module.exports = router;
