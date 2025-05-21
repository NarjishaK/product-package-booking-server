const asyncHandler = require("express-async-handler");
const SubCategory = require("../models/subcategory");
const Product = require('../models/products');

exports.getPackageWithProducts = async (req, res) => {
  try {
    const { packageId } = req.params;

    // 1. Find the package by ID and populate the category if needed
    const packageDetails = await SubCategory.findById(packageId).populate('category');
    if (!packageDetails) {
      return res.status(404).json({ message: 'Package not found' });
    }

    // 2. Find all products with the same mainCategory
    const products = await Product.find({ mainCategory: packageDetails.category._id });

    // 3. Return both package and related products
    res.status(200).json({
      package: packageDetails,
      products: products
    });

  } catch (error) {
    console.error('Error fetching package and products:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

//create subcategory
exports.create = asyncHandler(async (req, res) => {
  const { packagename, category, price, fromDate, toDate } = req.body;
  const image = req.file ? req.file.filename : "";

  const newPackage = await SubCategory.create({
    packagename,
    category,
    price,
    fromDate,
    toDate,
    image,
  });

  res.status(201).json(newPackage);
});

//get all subcategories
exports.getAll = asyncHandler(async (req, res) => {
    const subcategories = await SubCategory.find().populate('category'); 
    res.status(200).json(subcategories);
});


//get by Id
exports.get = asyncHandler(async (req, res) => {
    const subcategory = await SubCategory.findById(req.params.id).populate('category');
    res.status(200).json(subcategory);
})

//update subcategory
// Backend controller code update
exports.update = asyncHandler(async (req, res) => {
  // Only update fields that are provided in the request
  const updateFields = {};
  
  // Only include fields that exist in the request body
  if (req.body.packagename) updateFields.packagename = req.body.packagename;
  if (req.body.price) updateFields.price = req.body.price;
  if (req.body.category) updateFields.category = req.body.category;
  if (req.body.fromDate) updateFields.fromDate = req.body.fromDate;
  if (req.body.toDate) updateFields.toDate = req.body.toDate;
  
  // Handle image if provided
  if (req.file) {
    updateFields.image = req.file.filename;
  }

  // Only perform update if there are fields to update
  if (Object.keys(updateFields).length === 0 && !req.file) {
    return res.status(400).json({ message: "No fields to update" });
  }

  const subcategory = await SubCategory.findByIdAndUpdate(
    req.params.id, 
    updateFields, 
    {
      new: true,
      runValidators: true
    }
  ).populate('category');

  if (!subcategory) {
    return res.status(404).json({ message: "Subcategory not found" });
  }

  res.status(200).json(subcategory);
});

//delete subcategory
exports.delete = asyncHandler(async (req, res) => {
    const subcategory = await SubCategory.findByIdAndDelete(req.params.id);
    res.status(200).json(subcategory);
})

