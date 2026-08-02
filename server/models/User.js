const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
  },
  googleId: {
    type: String,
  },
  provider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  mobileNumber: {
    type: String,
    default: '',
  },
  dob: {
    type: String,
    default: '',
  },
  sex: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: '',
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
