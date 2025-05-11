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
  const images = req.files["images"]
    ? req.files["images"].map((file) => file.filename)
    : [];
  const coverImage = req.files["coverimage"]
    ? req.files["coverimage"][0].filename
    : null; 

  const productData = {
    mainCategory: req.body.mainCategory,
    gst: req.body.gst,
    about: req.body.about,
    coverimage: coverImage,
    videoLink: req.body.videoLink, 
    price: parseFloat(req.body.price),
    productId: newProductId,
    date: new Date(req.body.date),
    title: req.body.title,
    description: req.body.description,
    images: images,
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
  const products = await Product.find();
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


//update product
exports.update = asyncHandler(async (req, res) => {
  try {
    const updates = req.body;
    if (req.files) {
      if (req.files.images) {
        updates.images = req.files.images.map((file) => file.filename);
      }
      if (req.files.coverimage) {
        updates.coverimage = req.files.coverimage[0].filename;
      }
    }
    const updateObject = {};
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id },
      { $set: updateObject },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res
      .status(500)
      .json({ message: "Failed to update product", error: error.message });
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