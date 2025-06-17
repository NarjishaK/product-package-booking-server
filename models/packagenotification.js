// models/Notification.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PackageNotificationSchema = new Schema({
    message: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PackageNotification', PackageNotificationSchema);
