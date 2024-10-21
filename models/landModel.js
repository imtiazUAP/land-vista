const mongoose = require('mongoose');

const landSchema = new mongoose.Schema({
  name: String,
  description: String,
  imageUrl: String,
  price: Number,
  type: { type: String, enum: ['Residential', 'Commercial', 'Farming', 'Fish Farm'] },
  availabilityStatus: { type: String, enum: ['For Sale', 'For Rent', 'Sold', 'Leased', 'Auction'] },
  ownershipType: { type: String, enum: ['Private', 'Government', 'Common'] },
  coordinates: [[Number]],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Land', landSchema);