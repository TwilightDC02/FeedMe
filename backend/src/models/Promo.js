const mongoose = require('mongoose');

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

const Promo = mongoose.models.Promo || mongoose.model('Promo', promoSchema);

module.exports = Promo;