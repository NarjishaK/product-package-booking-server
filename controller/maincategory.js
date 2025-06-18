const asyncHandler = require("express-async-handler");
const Category = require("../models/maincategory");

//create category
exports.create = asyncHandler(async (req, res) => {
   const {name,vendor,updateperson,role} = req.body
    const category = await Category.create({
        name,
        vendor,
        updateperson,
        role
    });
    res.status(200).json(category);
})

//get all categories
exports.getAll = asyncHandler(async (req, res) => {
    const categories = await Category.find();
    res.status(200).json(categories);
})

//get by Id
exports.get = asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    res.status(200).json(category);
})

//update category
exports.update = asyncHandler(async (req, res) => {
    const { name, vendor ,updateperson,role} = req.body;
  
    const updates = {};
    if (name) updates.name = name;
    if (vendor) updates.vendor = vendor;
    if (updateperson) updates.updateperson = updateperson;
    if (role) updates.role = role;
  
    const category = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
  
    res.status(200).json(category);
  });
  

//delete category
exports.delete = asyncHandler(async (req, res) => {
    const category = await Category.findByIdAndDelete(req.params.id);
    res.status(200).json(category);
})
