const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
  },
  designation: String,
  agreement:{
    type: Boolean,
    default: false,
  },
  image: {
    type: String,
  },
  proofimage:{
    type:String
  },
  tokens: {
    type: String,
    default: "",
  },
  resetToken: {
    type: String,
  },
  resetTokenExpires: {
    type: Date,
  },
  blocked: {
    type: Boolean,
    default: false,
  },
  whatsapp: String,
  companyname: String,
  address: [
    {
      location: String,
      country: String,
      state: String,
      district: String,
      post: String,
      addressline: String,
    },
  ],
});

adminSchema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    if (!this.password.startsWith("$2b$")) {
      try {
        const hashedPassword = await bcrypt.hash(this.password, 10);
        this.password = hashedPassword;
        next();
      } catch (err) {
        console.log(err.message, "something went wrong in password hashing");
        return next(err);
      }
    } else {
      console.log("Password is already hashed.");
      return next();
    }
  } else {
    console.log("Password is not modified.");
    return next();
  }
});

module.exports = mongoose.model("Admin", adminSchema);
