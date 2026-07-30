'use strict';

const Marker = require('../models/Marker');

/**
 * GET /markers
 * Returns all markers that have not been soft-deleted.
 */
async function listMarkers(req, res, next) {
  try {
    const markers = await Marker.find({ deletedAt: null });
    return res.status(200).json(markers);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /markers/:id
 * Returns a single marker by ID, excluding soft-deleted documents.
 */
async function getMarker(req, res, next) {
  try {
    const marker = await Marker.findOne({ _id: req.params.id, deletedAt: null });
    if (!marker) {
      return res.status(404).json({ error: 'Marker not found' });
    }
    return res.status(200).json(marker);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /markers
 * Creates a new marker. Expects title, category, longitude, latitude in body.
 * Optional: description, author, date, image file (via multer).
 */
async function createMarker(req, res, next) {
  try {
    const { title, category, description, author, date, longitude, latitude } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Build GeoJSON location
    const location = {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)],
    };

    // Build marker data
    const markerData = {
      title,
      category,
      description: description || '',
      author: author || '',
      location,
      owner: req.user.userId,
    };

    if (date) {
      markerData.date = date;
    }

    // Persist image path if file was uploaded
    if (req.file) {
      markerData.imagePath = `uploads/${req.file.filename}`;
    }

    const marker = await Marker.create(markerData);
    return res.status(201).json(marker);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /markers/:id
 * Partial update of a marker. Only updates fields present in the request body.
 * Returns 403 if the authenticated user is not the owner, 404 if not found/deleted.
 */
async function updateMarker(req, res, next) {
  try {
    const marker = await Marker.findOne({ _id: req.params.id, deletedAt: null });
    if (!marker) {
      return res.status(404).json({ error: 'Marker not found' });
    }

    if (marker.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to edit this marker' });
    }

    const { title, category, description, author, date } = req.body;

    if (title !== undefined) marker.title = title;
    if (category !== undefined) marker.category = category;
    if (description !== undefined) marker.description = description;
    if (author !== undefined) marker.author = author;
    if (date !== undefined) marker.date = date;

    // Update imagePath if a new file was uploaded
    if (req.file) {
      marker.imagePath = `uploads/${req.file.filename}`;
    }

    await marker.save();
    return res.status(200).json(marker);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /markers/:id
 * Soft-deletes a marker by setting deletedAt to the current date.
 * Returns 403 if the authenticated user is not the owner, 404 if not found/deleted.
 */
async function deleteMarker(req, res, next) {
  try {
    const marker = await Marker.findOne({ _id: req.params.id, deletedAt: null });
    if (!marker) {
      return res.status(404).json({ error: 'Marker not found' });
    }

    if (marker.owner.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this marker' });
    }

    marker.deletedAt = new Date();
    await marker.save();
    return res.status(200).json({ message: 'Marker deleted' });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /markers/mine
 * Returns all non-deleted markers owned by the authenticated user.
 */
async function listMyMarkers(req, res, next) {
  try {
    const markers = await Marker.find({ owner: req.user.userId, deletedAt: null })
      .sort({ createdAt: -1 });
    return res.status(200).json(markers);
  } catch (err) {
    next(err);
  }
}

module.exports = { listMarkers, getMarker, createMarker, updateMarker, deleteMarker, listMyMarkers };
