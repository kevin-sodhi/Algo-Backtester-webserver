const mongoose = require('mongoose');
// clint-side validation
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ 
  },
  hash: {
    type: String,
    require: true,
  },
  salt: {
    type: String,
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

const User = mongoose.model('User', userSchema);
module.exports = User;