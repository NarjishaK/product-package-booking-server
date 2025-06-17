// const asyncHandler = require("express-async-handler");
// const AdminsModel = require("../models/admins");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
// const crypto = require('crypto');
// const nodemailer = require('nodemailer');
// require('dotenv').config(); 


// // Nodemailer configuration
// const transporter = nodemailer.createTransport({
//     service: 'gmail', 
//     auth: {
//         user: process.env.EMAIL,
//         pass: process.env.PASSWORD
//     }
// });
// //create admin
// exports.create = asyncHandler(async (req, res) => {
//   const { name, email, password, role, phone, designation, address,companyname } = req.body;
//   const image = req.file ? req.file.filename : null;
//     if (!name || !email || !password || !role || !phone) {
//       return res.status(400).json({ message: "Please add all fields" });
//     }
  
// // Check  email or phone already exists
//     const adminExists = await AdminsModel.findOne({ 
//       $or: [{ email: email }, { phone: phone }] 
//     });
  
//     if (adminExists) {
//       if (adminExists.email === email) {
//         return res.status(400).json({ message: "Email already exists" });
//       }
//       if (adminExists.phone === phone) {
//         return res.status(400).json({ message: "Phone number already exists" });
//       }
//     }


// const admin = await AdminsModel.create({
//   name,
//   email,
//   password,
//   role,
//   phone,
//   designation,
//   companyname,
//   image,
//   address,
// });

  
//     if (admin) {
//       return res.status(201).json({ message: "Admin created" });
//     } else {
//       return res.status(400).json({ message: "Admin not created" });
//     }
//   });
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

// Super Admin Email
const SUPER_ADMIN_EMAIL = 'narjisha.k@spacesofttechnologies.com';

// Function to send welcome email to vendor
const sendVendorWelcomeEmail = async (vendorEmail, vendorName, password, companyName) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: vendorEmail,
        subject: 'Welcome to Vendor Admin Panel - Access Credentials',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                }
                .header {
                    background-color: #4CAF50;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .content {
                    background-color: white;
                    padding: 30px;
                    border-radius: 0 0 8px 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .credentials {
                    background-color: #f4f4f4;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid #4CAF50;
                }
                .btn {
                    display: inline-block;
                    background-color: #4CAF50;
                    color: white;
                    padding: 12px 25px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    color: #666;
                    font-size: 12px;
                }
                .warning {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 15px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Welcome to Vendor Admin Panel!</h1>
                </div>
                <div class="content">
                    <h2>Hello ${vendorName},</h2>
                    <p>Congratulations! You have been successfully registered as a vendor for <strong>${companyName}</strong>.</p>
                    
                    <p>You now have access to the Vendor Admin Panel where you can:</p>
                    <ul>
                        <li>Manage your vendor profile</li>
                        <li>View and update your products/services</li>
                        <li>Track your orders and transactions</li>
                        <li>Access vendor dashboard and analytics</li>
                    </ul>

                    <div class="credentials">
                        <h3>🔐 Your Login Credentials:</h3>
                        <p><strong>Email:</strong> ${vendorEmail}</p>
                        <p><strong>Password:</strong> ${password}</p>
                        <p><strong>Role:</strong> Vendor</p>
                    </div>

                    <div class="warning">
                        <strong>⚠️ Security Notice:</strong> Please change your password after your first login for security purposes.
                    </div>

                    <p>Click the button below to access your vendor admin panel:</p>
                    <a href="${process.env.BACKEND_URL || 'http://localhost:5173'}" class="btn">
                        Access Vendor Panel
                    </a>

                    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
                    
                    <p>Best regards,<br/>
                    The Admin Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>© ${new Date().getFullYear()} Your Deelzon. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent successfully to:', vendorEmail);
        return { success: true, message: 'Email sent successfully' };
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return { success: false, message: 'Failed to send email', error: error.message };
    }
};

// Function to send notification to super admin about new vendor
const sendSuperAdminNotification = async (vendorEmail, vendorName, companyName, phone, designation) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: SUPER_ADMIN_EMAIL,
        subject: `New Vendor Created: ${vendorName} - ${companyName}`,
        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                .container {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f9f9f9;
                }
                .header {
                    background-color: #2196F3;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 8px 8px 0 0;
                }
                .content {
                    background-color: white;
                    padding: 30px;
                    border-radius: 0 0 8px 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                .vendor-info {
                    background-color: #f4f4f4;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid #2196F3;
                }
                .footer {
                    text-align: center;
                    margin-top: 20px;
                    color: #666;
                    font-size: 12px;
                }
                .status {
                    background-color: #d4edda;
                    border: 1px solid #c3e6cb;
                    color: #155724;
                    padding: 10px;
                    border-radius: 5px;
                    margin: 15px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🆕 New Vendor Created</h1>
                </div>
                <div class="content">
                    <h2>Hello Super Admin,</h2>
                    <p>A new vendor has been successfully created in the system.</p>
                    
                    <div class="vendor-info">
                        <h3>📋 Vendor Details:</h3>
                        <p><strong>Name:</strong> ${vendorName}</p>
                        <p><strong>Email:</strong> ${vendorEmail}</p>
                        <p><strong>Company:</strong> ${companyName}</p>
                        <p><strong>Phone:</strong> ${phone}</p>
                        <p><strong>Designation:</strong> ${designation}</p>
                        <p><strong>Role:</strong> Vendor</p>
                        <p><strong>Created On:</strong> ${new Date().toLocaleString()}</p>
                    </div>

                    <div class="status">
                        <strong>✅ Status:</strong> Vendor account created successfully and welcome email sent to the vendor.
                    </div>

                    <p>The vendor has been notified via email with their login credentials and can now access the vendor admin panel.</p>
                    
                    <p>Best regards,<br/>
                    System Notification</p>
                </div>
                <div class="footer">
                    <p>This is an automated system notification.</p>
                    <p>© ${new Date().getFullYear()} Your Deelzon. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Super admin notification sent successfully to:', SUPER_ADMIN_EMAIL);
        return { success: true, message: 'Super admin notification sent successfully' };
    } catch (error) {
        console.error('Error sending super admin notification:', error);
        return { success: false, message: 'Failed to send super admin notification', error: error.message };
    }
};

//create admin
exports.create = asyncHandler(async (req, res) => {
    const { name, email, password, role, phone, designation, address, companyname } = req.body;
    const image = req.file ? req.file.filename : null;
    
    if (!name || !email || !password || !role || !phone) {
        return res.status(400).json({ message: "Please add all fields" });
    }

    // Check if email or phone already exists
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

    // Store the plain password for email (before hashing)
    const plainPassword = password;

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
        // Send welcome email if the role is vendor
        if (role === 'vendor') {
            const emailResult = await sendVendorWelcomeEmail(
                email, 
                name, 
                plainPassword, 
                companyname || 'Our Platform'
            );
            
            // Send notification to super admin
            const adminNotificationResult = await sendSuperAdminNotification(
                email,
                name,
                companyname || 'Our Platform',
                phone,
                designation || 'Vendor'
            );
            
            if (emailResult.success && adminNotificationResult.success) {
                return res.status(201).json({ 
                    message: "Vendor created successfully and welcome email sent",
                    emailSent: true,
                    adminNotified: true
                });
            } else if (emailResult.success && !adminNotificationResult.success) {
                return res.status(201).json({ 
                    message: "Vendor created successfully and welcome email sent, but failed to notify super admin",
                    emailSent: true,
                    adminNotified: false,
                    adminNotificationError: adminNotificationResult.message
                });
            } else if (!emailResult.success && adminNotificationResult.success) {
                return res.status(201).json({ 
                    message: "Vendor created successfully and super admin notified, but failed to send welcome email",
                    emailSent: false,
                    adminNotified: true,
                    emailError: emailResult.message
                });
            } else {
                return res.status(201).json({ 
                    message: "Vendor created successfully but failed to send welcome email and notify super admin",
                    emailSent: false,
                    adminNotified: false,
                    emailError: emailResult.message,
                    adminNotificationError: adminNotificationResult.message
                });
            }
        } else {
            return res.status(201).json({ message: "Admin created successfully" });
        }
    } else {
        return res.status(400).json({ message: "Admin not created" });
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