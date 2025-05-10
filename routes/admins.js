var express = require('express');
var router = express.Router();
const Controller = require('../controller/admins')
require('dotenv').config(); 
const nodemailer = require('nodemailer');
const Authentication = require('../middleware/auth')
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

//admin signup and login routes
router.post('/',upload.single("image"),Controller.create)
router.get('/',Controller.getAll)
router.get('/:id',Controller.get)
router.put('/:id',upload.single("image"),Controller.update)
router.delete('/:id',Controller.delete)
router.delete('/',Controller.deleteAll)
router.post('/login',Controller.login)
router.post('/forgot-password',Controller.forgotPassword);
router.post('/reset-password',Controller.resetPassword);
router.put('/block/:id', Controller.toggleBlockAdmin);
router.put('/unblock/:id',Controller.unblockAdmin);
router.put('/change-password/:adminId', Controller.changePassword);


//contact us


// Define the POST route for sending an email
router.post('/send-email', async (req, res) => {
  const { to, name, email, subject, message } = req.body;

  // Configure the email transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL, 
      pass: process.env.PASSWORD,
    },
  });

  // Email options
  const mailOptions = {
    from: email,
    to: to,
    subject: `${subject} - from ${name}`,
    text: message,
    html: `<p><strong>Name:</strong> ${name}</p>
           <p><strong>Email:</strong> ${email}</p>
           <p><strong>Message:</strong><br/>${message}</p>`,
  };

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again.' });
  }
});


module.exports = router;
