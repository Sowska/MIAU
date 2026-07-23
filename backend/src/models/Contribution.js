'use strict';

const mongoose = require('mongoose');

const ContributionSchema = new mongoose.Schema({
  note:   { type: String, required: true },
  marker: { type: mongoose.Schema.Types.ObjectId, ref: 'Marker', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Contribution', ContributionSchema);
