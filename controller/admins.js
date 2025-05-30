const asyncHandler = require("express-async-handler");
const AdminsModel = require("../models/admins");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config(); 


// Nodemailer configuration
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

// Generate OTP and send it to the user's email
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const admin = await AdminsModel.findOne({ email });
        if (!admin) {
            return res.status(400).json({ message: 'User with this email does not exist.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
        admin.resetToken = otp;
        admin.resetTokenExpires = Date.now() + 3600000; // 1 hour
        await admin.save();
        await transporter.sendMail({
            from: 'your-email@gmail.com',
            to: admin.email,
            subject: 'Your OTP for password reset',
            text: `Your OTP is ${otp}`
        });

        res.status(200).json({ message: 'OTP sent to your email.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
};

// Verify OTP and reset password
exports.resetPassword = async (req, res) => {
    const { email, otp, newPassword, confirmPassword } = req.body;

    try {
        const admin = await AdminsModel.findOne({
            email,
            resetToken: otp,
            resetTokenExpires: { $gt: Date.now() } 
        });

        if (!admin) {
            return res.status(400).json({ message: 'Invalid OTP or OTP expired.' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }
        // Hash the new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        admin.password = hashedPassword;
        admin.resetToken = undefined; // Clear the reset token
        admin.resetTokenExpires = undefined;
        await admin.save();
        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error.' });
    }
};

//create admin
exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, designation, address,companyname } = req.body;
  const image = req.file ? req.file.filename : null;
    if (!name || !email || !password || !role || !phone) {
      return res.status(400).json({ message: "Please add all fields" });
    }
  
// Check  email or phone already exists
    const adminExists = await AdminsModel.findOne({ 
      $or: [{ email: email }, { phone: phone }] 
    });
  
    if (adminExists) {
      if (adminExists.email === email) {
        return res.status(400).json({ message: "Email already exists" });
      }
      if (adminExists.phone === phone) {
        return res.status(400).json({ message: "Phone number already exists" });
      }
    }


const admin = await AdminsModel.create({
  name,
  email,
  password,
  role,
  phone,
  designation,
  companyname,
  image,
  address,
});

  
    if (admin) {
      return res.status(201).json({ message: "Admin created" });
    } else {
      return res.status(400).json({ message: "Admin not created" });
    }
  });
  
//get all admins
exports.getAll = asyncHandler(async (req, res) => {
    const admins = await AdminsModel.find();
    res.status(200).json(admins);
})

//get by Id
exports.get = asyncHandler(async (req, res) => {
    const admin = await AdminsModel.findById(req.params.id);
    res.status(200).json(admin);
})

// Update admin
exports.update = asyncHandler(async (req, res) => {
    const { email, name, phone, role,whatsapp,address,agreement,designation,companyname } = req.body;
    const { id } = req.params;
   
    try {
      const admin = await AdminsModel.findById(id);
      if (!admin) {
        return res.status(400).json({ message: "Admin not found to update" });
      }
      // Check if email or phone is already being used by another admin
      const emailExists = await AdminsModel.findOne({ email, _id: { $ne: id } });
      const phoneExists = await AdminsModel.findOne({ phone, _id: { $ne: id } });
     
      
      if (emailExists) {
        return res.status(400).json({ message: "Email already in use by another admin" });
      }
      if (phoneExists) {
        return res.status(400).json({ message: "Phone number already in use by another admin" });
      } 
      let parsedAddress = address;
      if (typeof address === 'string') {
        parsedAddress = JSON.parse(address);
      }
      admin.address = parsedAddress;
      admin.email = email;
      admin.role = role;
      admin.name = name;
      admin.phone = phone;
      admin.whatsapp = whatsapp;
      admin.agreement=agreement;
      admin.designation=designation;
      admin.companyname=companyname;
      if (req.files['image']) {
        admin.image = req.files['image'][0].filename;
      }
      if (req.files['proofimage']) {
        admin.proofimage = req.files['proofimage'][0].filename;
      }
      
      const updatedAdmin = await admin.save();
      return res.json({ updatedAdmin });
      
    } catch (err) {
      console.log(err, "An error occurred during admin update");
      return res.status(500).json({ message: "An error occurred during admin update" });
    }
  });
  

//delete admin
exports.delete = asyncHandler(async (req, res) => {
    const admin = await AdminsModel.findByIdAndDelete(req.params.id);
    res.status(200).json({message: "Admin deleted"});
})

//delete all admins
exports.deleteAll = asyncHandler(async (req, res) => {
    const admin = await AdminsModel.deleteMany();
    res.status(200).json(admin);
})

//login admin  and store token and details in local storage
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    try {
      const admin = await AdminsModel.findOne({ email: email });
      if (!admin) {
        return res
          .status(400)
          .json({ invalid: true, message: "Invalid email or password" });
      }
      if (admin.blocked) {
        return res.status(403).json({ message: "Your account is blocked" }); 
    }
      const isPasswordMatch = await bcrypt.compare(password, admin.password);
      if (isPasswordMatch) {
        const adminDetails = {
          name: admin.name,
          email: admin.email,
          _id: admin._id,
          role: admin.role,
          phone: admin.phone,
          image: admin.image,
          proofimage: admin.proofimage,
          password: password,
          whatsapp: admin.whatsapp,
          designation: admin.designation,
          companyname: admin.companyname,
          agreement:admin.agreement,
          address: admin.address
        };
        
        const token = jwt.sign({ email: admin.email, id: admin._id }, "myjwtsecretkey", { expiresIn: "1h" });
        admin.tokens = token;
        await admin.save();
        
        return res.status(200).json({ token, adminDetails });
      } else {
        return res.status(400).json({ invalid: true, message: "Invalid email or password" });
      }
    } catch (err) {
      return res.status(500).json({ error: "Server error, please try again" });
    }
});


// Block an admin
exports.toggleBlockAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const admin = await AdminsModel.findById(id);
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        
        admin.blocked = !admin.blocked; 
        await admin.save();

        return res.status(200).json({ message: admin.blocked ? "Admin blocked" : "Admin unblocked", admin });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});


// Unblock an admin
exports.unblockAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params; // Get admin ID from URL parameters
    try {
        const admin = await AdminsModel.findByIdAndUpdate(id, { blocked: false }, { new: true });
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        return res.status(200).json({ message: "Admin unblocked successfully", admin });
    } catch (err) {
        return res.status(500).json({ error: "Server error, please try again" });
    }
});



//  to update the password
exports.changePassword = async (req, res) => {
    const { adminId } = req.params;
    const { newPassword } = req.body;

    try {
        const admin = await AdminsModel.findById(adminId);
        if (!admin) {
            return res.status(404).json({ message: 'Admin not found' });
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        admin.password = hashedPassword;
        await admin.save();
        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ message: 'Server error while updating password' });
    }
};

//agreement confirm (false to true)
exports.agreementConfirm = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const admin = await AdminsModel.findByIdAndUpdate(id, { agreement: true }, { new: true });
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        return res.status(200).json({ message: "Agreement confirmed successfully", admin });
    } catch (err) {
        return res.status(500).json({ error: "Server error, please try again" });
    }
});