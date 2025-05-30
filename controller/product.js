const asyncHandler = require("express-async-handler");
const Product = require("../models/products");
const ShoppingBag = require("../models/shoppingbag");
const WhishList = require("../models/favorites");
const CustomerOrder = require("../models/customerorder");
// const about = require("../models/about");

// // Function to generate new product ID
const generateProductId = async () => {
  const lastProduct = await Product.findOne().sort({ createdAt: -1 }); // Find the last product by creation time
  let newProductId = "PR-ID0000001"; 

  if (lastProduct && lastProduct.productId) {
    const lastNumericId = parseInt(lastProduct.productId.replace("PR-ID", ""));
    const nextId = (lastNumericId + 1).toString().padStart(7, "0");
    newProductId = `PR-ID${nextId}`;
  }

  return newProductId;
};
//create product
exports.create = asyncHandler(async (req, res) => {
  // Generate the new product ID
  const newProductId = await generateProductId();
  const coverImage = req.files["coverimage"]
    ? req.files["coverimage"][0].filename
    : null; 

  const productData = {
    mainCategory: req.body.mainCategory,
    about: req.body.about,
    coverimage: coverImage,
    productId: newProductId,
    title: req.body.title,
    description: req.body.description,
    tag: req.body.tag,
  };

  try {
    const product = await Product.create(productData);
    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});
//get all products
exports.getAll = asyncHandler(async (req, res) => {
  const products = await Product.find().populate("mainCategory");
  res.status(200).json(products);
});

//get by Id
exports.get = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.status(200).json(product);
});
// exports.get = asyncHandler(async (req, res) => {
//   const id = req.params.id;
//   const product = await Product.findById(id);
//   if (!product) {
//     return res.status(404).json({ message: "Product not found" });
//   }
//   res.status(200).json(product);
// });


// Fixed update product controller
exports.update = asyncHandler(async (req, res) => {
  try {
    // Get the current product
    const existingProduct = await Product.findById(req.params.id);
    if (!existingProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updates = { ...req.body };

    // Handle file uploads if they exist, otherwise keep existing
    if (req.files) {

      if (req.files.coverimage && req.files.coverimage[0]) {
        updates.coverimage = req.files.coverimage[0].filename;
      } else {
        updates.coverimage = existingProduct.coverimage;
      }
    } else {
      // If no files at all were uploaded, keep both existing
      updates.coverimage = existingProduct.coverimage;
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      message: "Failed to update product",
      error: error.message,
    });
  }
});


// delete product
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  // Remove the product from all shopping bags by its product ID
  await ShoppingBag.updateMany(
    {},
    { $pull: { products: { productId: product._id } } }
  );

  // Remove all wishlist entries with the product ID
  await WhishList.deleteMany({ productId: product._id });

  await CustomerOrder.deleteMany({productId: product._id})

  res.status(200).json({ message: "Product deleted successfully" });
});


//fetch products by category
exports.getProductsByCategory = async (req, res) => {
    try {
        const categoryName = req.query.category;
        console.log('Received request for category:', categoryName);
        
        if (!categoryName) {
            return res.status(400).json({ message: 'Category name is required' });
        }

        const products = await Product.find({ mainCategory: categoryName });
        console.log('Found products:', products);
        
        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found for this category' });
        }

        res.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: 'Error fetching products', error: error.message });
    }
};