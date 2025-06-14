const asyncHandler = require("express-async-handler");
const Banner = require("../models/banner");

const fs = require("fs");
const path = require("path");
const sharp = require("sharp"); // image processing

// Update banner
exports.update = asyncHandler(async (req, res) => {
  const updatedData = {
    title: req.body.title,
    description: req.body.description,
  };

  // If there's a new image uploaded
  if (req.file) {
    const imagePath = path.join(__dirname, "../public/images", req.file.filename);

    try {
      const metadata = await sharp(imagePath).metadata();

      // Validate dimensions
      if (metadata.width !== 1920 || metadata.height !== 700) {
        // Delete the image if it doesn't meet requirements
        fs.unlinkSync(imagePath);
        return res.status(400).json({
          message: "Image must be exactly 1920x700 pixels",
        });
      }

      updatedData.image = req.file.filename;

    } catch (err) {
      return res.status(500).json({ message: "Error processing image", error: err });
    }
  }

  const banner = await Banner.findByIdAndUpdate(req.params.id, updatedData, {
    new: true,
    runValidators: true,
  });

  if (!banner) {
    return res.status(404).json({ message: "Banner not found" });
  }

  res.status(200).json(banner);
});
//create banner

exports.create = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: "Image is required" });
  }

  const imagePath = path.join(__dirname, "../public/images", req.file.filename);

  // Check image dimensions
  try {
    const metadata = await sharp(imagePath).metadata();

    if (metadata.width !== 1920 || metadata.height !== 700) {
      // Delete the image if it doesn't meet requirements
      fs.unlinkSync(imagePath);
      return res.status(400).json({
        message: "Image must be exactly 1920x700 pixels",
      });
    }
  } catch (err) {
    return res.status(500).json({ message: "Error processing image", error: err });
  }

  // Save banner if image is valid
  const banner = await Banner.create({
    title,
    description,
    image: req.file.filename,
  });

  res.status(200).json(banner);
});


//get all banners
exports.getAll = asyncHandler(async (req, res) => {
  const banners = await Banner.find();
  res.status(200).json(banners);
});

//get by Id
exports.get = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);
  res.status(200).json(banner);
});

//delete banner
exports.delete = asyncHandler(async (req, res) => {
  const banner = await Banner.findByIdAndDelete(req.params.id);
  res.status(200).json(banner);
});

//delete all banners
exports.deleteAll = asyncHandler(async (req, res) => {
  const banners = await Banner.deleteMany();
  res.status(200).json(banners);
});
