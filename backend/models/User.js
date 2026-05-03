const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'usuario'],
    default: 'usuario'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
