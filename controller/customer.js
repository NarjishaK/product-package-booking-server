
const Customer = require("../models/customer");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const OTPService = require('../services/otpService'); // Assume this service handles OTP generation and verification
require('dotenv').config();


 


// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

// Generate OTP and verification token
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Send verification email
const sendVerificationEmail = async (email, name, verificationToken, otp) => {
    const verificationUrl = `${process.env.FRONTEND_URL}/verifyemail?token=${verificationToken}`;
    
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Email Verification - Complete Your Registration',
        html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                <h2 style="color: #333; text-align: center;">Welcome ${name}!</h2>
                <p style="color: #666; font-size: 16px;">Thank you for registering. Please verify your email address to complete your account setup.</p>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                    <h3 style="color: #333; margin-bottom: 10px;">Your Verification Code:</h3>
                    <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px; margin: 10px 0;">${otp}</h1>
                </div>
                
                <p style="color: #666; margin: 20px 0;">Click the button below to verify your email address:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" 
                       style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="color: #888; font-size: 14px;">Or copy and paste this link in your browser:</p>
                <p style="color: #007bff; word-break: break-all; font-size: 14px;">${verificationUrl}</p>
                
                <p style="color: #888; font-size: 14px; margin-top: 30px;">This verification link will expire in 24 hours.</p>
                <p style="color: #888; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
            </div>
        `
    };
    
    await transporter.sendMail(mailOptions);
};

//create customer (with email verification)
exports.create = asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body;
    
    if (!name || !email || !phone || !password) {
        return res.status(400).json({ message: "Please add all fields" });
    }

    // Check if email or phone already exists
    const customerExists = await Customer.findOne({ 
        $or: [{ email: email }, { phone: phone }] 
    });

    if (customerExists) {
        if (customerExists.email === email) {
            return res.status(400).json({ message: "Email already exists" });
        }
        if (customerExists.phone === phone) {
            return res.status(400).json({ message: "Phone number already exists" });
        }
    }

    try {
        // Generate verification token and OTP
        const verificationToken = generateVerificationToken();
        const otp = generateOTP();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create customer with verification fields
        const customerData = {
            ...req.body,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
            isEmailVerified: false,
            isActive: false
        };

        const customer = await Customer.create(customerData);

        // Send verification email
        await sendVerificationEmail(email, name, verificationToken, otp);

        res.status(201).json({ 
            message: "Account created successfully! Please check your email to verify your account.",
            customerId: customer._id
        });

    } catch (error) {
        console.error("Error creating customer:", error);
        res.status(500).json({ message: "Failed to create account. Please try again." });
    }
});

// Verify email
exports.verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: "Verification token is required" });
    }

    try {
        // Find customer with the verification token
        const customer = await Customer.findOne({
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!customer) {
            return res.status(400).json({ message: "Invalid or expired verification token" });
        }

        // Mark email as verified and activate account
        customer.isEmailVerified = true;
        customer.isActive = true;
        customer.emailVerificationToken = undefined;
        customer.emailVerificationExpires = undefined;

        await customer.save();

        res.status(200).json({ 
            message: "Email verified successfully! Your account is now active.",
            success: true
        });

    } catch (error) {
        console.error("Error verifying email:", error);
        res.status(500).json({ message: "Email verification failed. Please try again." });
    }
});

// Resend verification email
exports.resendVerification = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const customer = await Customer.findOne({ email: email });

        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        if (customer.isEmailVerified) {
            return res.status(400).json({ message: "Email is already verified" });
        }

        // Generate new verification token and OTP
        const verificationToken = generateVerificationToken();
        const otp = generateOTP();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

        customer.emailVerificationToken = verificationToken;
        customer.emailVerificationExpires = verificationExpires;
        await customer.save();

        // Send new verification email
        await sendVerificationEmail(email, customer.name, verificationToken, otp);

        res.status(200).json({ 
            message: "Verification email sent successfully! Please check your email."
        });

    } catch (error) {
        console.error("Error resending verification:", error);
        res.status(500).json({ message: "Failed to resend verification email. Please try again." });
    }
});













//create customer
// exports.create = asyncHandler(async (req, res) => {
//     const { name, email, phone, password } = req.body;
//     if (!name || !email || !phone   ) {
//         return res.status(400).json({ message: "Please add all fields" });
//     }

//     // Check  email or phone already exists
//     const customerExists = await Customer.findOne({ 
//         $or: [{ email: email }, { phone: phone }] 
//     });

//     if (customerExists) {
//         if (customerExists.email === email) {
//             return res.status(400).json({ message: "Email already exists" });
//         }
//         if (customerExists.phone === phone) {
//             return res.status(400).json({ message: "Phone number already exists" });
//         }
//     }
//     const customer = await Customer.create(req.body);
//     res.status(200).json(customer);
// })

//get all customers
exports.getAll = asyncHandler(async (req, res) => {
    const customers = await Customer.find();
    res.status(200).json(customers);
})


//get by Id
exports.get = asyncHandler(async (req, res) => {
    const customer = await Customer.findById(req.params.id);
    res.status(200).json(customer);
})


//update customer
exports.update = asyncHandler(async (req, res) => {
    const { name, email, phone, address } = req.body;
    const { id } = req.params;
    // Check if email or phone is already being used by another customer
    const emailExists = await Customer.findOne({ email, _id: { $ne: id } });
    const phoneExists = await Customer.findOne({ phone, _id: { $ne: id } });

    if (emailExists) {
        return res.status(400).json({ message: "Email already in use by another customer" });
    }
    if (phoneExists) {
        return res.status(400).json({ message: "Phone number already in use by another customer" });
    }
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
        new: true
    });
    res.status(200).json(customer);
})


//delete customer
exports.delete = asyncHandler(async (req, res) => {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    res.status(200).json(customer);
})


//delete all customers
exports.deleteAll = asyncHandler(async (req, res) => {
    const customers = await Customer.deleteMany();
    res.status(200).json(customers);
})


//get customer suggestions
exports.getCustomerSuggestions = async (req, res) => {
    try {
      const { query } = req.query;
      const customers = await Customer.find({ name: { $regex: query, $options: 'i' } })
        .select('name email phone address')
        .limit(5);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Error fetching customer suggestions", error });
    }
  };

  //login customer
  exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    try {
      const admin = await Customer.findOne({ email: email });
      if (!admin) {
        console.log("No user found with email:", email);
        return res
          .status(400)
          .json({ invalid: true, message: "Invalid email or password" });
      }
      const isPasswordMatch = await bcrypt.compare(password, admin.password);
      if (isPasswordMatch) {
        console.log("Password matched for user:", email);
        const customerDetails = {
          name: admin.name,
          email: admin.email,
          _id: admin._id,
          phone: admin.phone,
          address: admin.address,
          password: password,
        };

        const token = jwt.sign(
          { email: admin.email, id: admin._id },
          "myjwtsecretkey",
          { expiresIn: "1h" }
        );
        admin.tokens = token;
        await admin.save();

        return res.status(200).json({ token, customerDetails });
      } else {
        console.log("Invalid password for user:", email);
        return res
          .status(400)
          .json({ invalid: true, message: "Invalid email or password" });
      }
    } catch (err) {
      console.error("Login error:", err);
      return res.status(500).json({ error: "Server error, please try again" });
    }
  });


// Send OTP for password reset
exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = OTPService.generateOTP();
    // Call the modified sendEmailOTP and pass email and otp
    const response = await OTPService.sendEmailOTP(email, otp);

    if (response.status !== 200) {
      return res.status(response.status).json({ message: response.message });
    }

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Error sending OTP', error });
  }
};



// Verify OTP
exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    const isValidOTP = OTPService.verifyOTP(email, otp);
    if (!isValidOTP) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    res.status(200).json({ message: 'OTP verified' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying OTP', error });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    customer.password = hashedPassword;
    await customer.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating password', error });
  }
};




//update password
exports.updatePassword = async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword, confirmNewPassword } = req.body;

  if (newPassword !== confirmNewPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const isMatch = await bcrypt.compare(oldPassword, customer.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect old password" });

    customer.password = newPassword;
    await customer.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


















// const nodemailer = require('nodemailer');
require('dotenv').config();


// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.log('Transporter configuration error:', error);
  } else {
    console.log('Email transporter is ready');
  }
});


//customer service
exports.sendContactEmail = async (req, res) => {
  try {
    const { firstName, email, subject, phone, message } = req.body;

    // Validate required fields
    if (!firstName || !email) {
      return res.status(400).json({
        success: false,
        message: 'First name and email are required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Email content for you (receiver)
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .field { margin-bottom: 15px; padding: 10px; background: white; border-radius: 5px; border-left: 4px solid #007bff; }
          .field-label { font-weight: bold; color: #007bff; margin-bottom: 5px; }
          .field-value { color: #333; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Contact Form Submission</h1>
            <p>You have received a new message from your website</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="field-label">Name:</div>
              <div class="field-value">${firstName}</div>
            </div>
            <div class="field">
              <div class="field-label">Email:</div>
              <div class="field-value">${email}</div>
            </div>
            ${subject ? `
            <div class="field">
              <div class="field-label">Subject:</div>
              <div class="field-value">${subject}</div>
            </div>
            ` : ''}
            ${phone ? `
            <div class="field">
              <div class="field-label">Phone:</div>
              <div class="field-value">${phone}</div>
            </div>
            ` : ''}
            ${message ? `
            <div class="field">
              <div class="field-label">Message:</div>
              <div class="field-value">${message}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="field-label">Submitted At:</div>
              <div class="field-value">${new Date().toLocaleString()}</div>
            </div>
          </div>
          <div class="footer">
            <p>This email was sent from your website contact form</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Email options for you (receiver)
    const mailOptions = {
      from: `"Contact Form" <${process.env.EMAIL}>`,
      to: process.env.EMAIL,
      subject: subject ? `Contact Form: ${subject}` : `New Contact Form Submission from ${firstName}`,
      html: htmlContent,
      replyTo: email
    };

    // Send email to you
    await transporter.sendMail(mailOptions);

    // Auto-reply email to sender
    const autoReplyHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .message { background: white; padding: 20px; border-radius: 5px; border-left: 4px solid #28a745; }
          .contact-info { background: white; padding: 15px; border-radius: 5px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Contacting Us!</h1>
            <p>We've received your message</p>
          </div>
          <div class="content">
            <div class="message">
              <p>Dear ${firstName},</p>
              <p>Thank you for reaching out to us! We have successfully received your message and will get back to you as soon as possible.</p>
              <p>We typically respond within 24-48 hours during business days.</p>
            </div>
            <div class="contact-info">
              <h3>Our Contact Information:</h3>
              <p><strong>Email:</strong> sales@deelzon.com</p>
              <p><strong>Phone:</strong> 96455 22822</p>
              <p><strong>Address:</strong> Deelzon c/o Elite Company, Vadanapally, Thrissur</p>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated response. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Auto-reply options
    const autoReplyOptions = {
      from: `"Deelzon Support" <${process.env.EMAIL}>`,
      to: email,
      subject: 'Thank you for contacting us - We received your message',
      html: autoReplyHtml
    };

    // Send auto-reply to sender
    await transporter.sendMail(autoReplyOptions);

    // Success response
    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully! We will get back to you soon.'
    });

  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
