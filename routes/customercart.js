var express = require('express');
var router = express.Router();
var Controller = require('../controller/customercart');

//customer cart  routes
router.post('/',Controller.create)
router.get("/:customerId",Controller.getByCustomerId);
// Update cart item quantity
router.put('/:id', Controller.updateQuantity);

// Delete specific cart item
router.delete('/:id', Controller.delete);

// Clear customer cart (remove all items)
router.delete('/customer/:customerId', Controller.clearCart);


module.exports = router;
