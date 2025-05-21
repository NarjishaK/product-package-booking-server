var express = require('express');
var router = express.Router();
const SubController = require('../controller/subcategory')
const SubCategory = require('../models/subcategory')
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

var upload = multer({ storage: storage });

//filter by category
router.get('/subcategory', async (req, res) => {
    try {
      const { category } = req.query;
      let subcategories;
      
      if (category) {
        subcategories = await SubCategory.find({ category });
      } else {
        subcategories = await SubCategory.find();
      }
      
      res.json(subcategories);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
//sub category routes
router.post('/',upload.single("image"),SubController.create)
router.get('/package/:packageId',SubController.getPackageWithProducts);
router.get('/',SubController.getAll)
router.get('/:id',SubController.get)
router.put('/:id',upload.single("image"),SubController.update)
router.delete('/:id',SubController.delete)
module.exports = router;
