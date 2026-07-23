'use strict';

const mongoose = require('mongoose');

const MarkerSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  category:    { type: String, enum: ['mural', 'graffiti', 'sculpture'], required: true },
  description: { type: String, default: '' },
  author:      { type: String, default: '' },
  date:        { type: Date },
  imagePath:   { type: String, default: null },
  location: {
    type:        { type: String, enum: ['Point'], required: true, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  owner:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deletedAt: { type: Date, default: null },
}, { timestamps: true });

MarkerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Marker', MarkerSchema);
