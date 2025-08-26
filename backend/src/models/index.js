const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  subscription: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const promotionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  validUntil: {
    type: Date,
    required: true,
  },
});

const User = mongoose.model('User', userSchema);
const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = {
  User,
  Promotion,
};