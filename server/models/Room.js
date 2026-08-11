const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  hostId: {
    type: String,
  }
}, { timestamps: true });

const Room = mongoose.model('Room', roomSchema);
module.exports = Room;
