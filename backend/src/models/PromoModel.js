const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   lastname: {
//     type: String,
//     required: [true, 'Please provide your last name'],
//     trim: true
//   },
//   firstname: {
//     type: String,
//     required: [true, 'Please provide your first name'],
//     trim: true
//   },
//   middlename: {
//     type: String,
//     required: false,
//     trim: true
//   },
//   username: {
//     type: String,
//     required: [true, 'Please provide a username'],
//     unique: true,
//     trim: true,
//     lowercase: true
//   },
//   email: {
//     type: String,
//     required: [true, 'Please provide an email'],
//     unique: true,
//     lowercase: true,
//     match: [[/\S+@\S+\.\S+/, 'Please provide a valid email address.']]
//   },
//   password: {
//     type: String,
//     required: [true, 'Please provide a password'],
//     minlength: 8,
//     select: false
//   },
//   currentCards: {
//     type: [String],
//     default: []
//   },
//   savedPromos: [{
//     type: mongoose.Schema.ObjectId,
//     ref: 'Promo'
//   }]
// }, {
//   timestamps: true
// });

const promoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
    unique: true
  },
  promoPeriod: {
    type: String,
    required: true
  },
  offer: {
    type: Object,
    required: true
  },
  participatingCards: {
    type: [String],
    required: true
  }
}, {
  timestamps: true
});
// const User = mongoose.model('User', userSchema);
const Promo = mongoose.models.Promo || mongoose.model('Promo', promoSchema);

module.exports = Promo;