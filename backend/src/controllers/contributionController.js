'use strict';

const Marker = require('../models/Marker');
const Contribution = require('../models/Contribution');

/**
 * POST /markers/:id/contributions
 * Creates a contribution note for a marker. Requires authentication.
 */
async function createContribution(req, res, next) {
  try {
    const { note } = req.body;

    // Validate note is not empty
    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Note is required' });
    }

    // Verify marker exists and is not soft-deleted
    const marker = await Marker.findOne({ _id: req.params.id, deletedAt: null });
    if (!marker) {
      return res.status(404).json({ error: 'Marker not found' });
    }

    // Create contribution
    const contribution = await Contribution.create({
      note: note.trim(),
      marker: req.params.id,
      author: req.user.userId,
    });

    return res.status(201).json(contribution);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /markers/:id/contributions
 * Lists all contributions for a marker. Only the marker owner can access.
 */
async function listContributions(req, res, next) {
  try {
    // Verify marker exists and is not soft-deleted
    const marker = await Marker.findOne({ _id: req.params.id, deletedAt: null });
    if (!marker) {
      return res.status(404).json({ error: 'Marker not found' });
    }

    // Only the marker owner can view contributions
    if (marker.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to view contributions' });
    }

    // Return all contributions for this marker
    const contributions = await Contribution.find({ marker: req.params.id });
    return res.status(200).json(contributions);
  } catch (err) {
    next(err);
  }
}

module.exports = { createContribution, listContributions };
