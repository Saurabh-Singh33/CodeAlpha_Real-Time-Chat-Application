const mongoose = require('mongoose');

const adminProfileSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  displayName: { type: String, default: 'Saurabh Singh' },
  passwordHash: { type: String }, // Store the password hash here eventually
}, { timestamps: true });

module.exports = mongoose.model('AdminProfile', adminProfileSchema);
