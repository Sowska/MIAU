'use strict';

const express = require('express');
const router = express.Router();
const { listMarkers, getMarker, createMarker, updateMarker, deleteMarker, listMyMarkers } = require('../controllers/markerController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const contributionRoutes = require('./contributionRoutes');

// GET /api/markers — list all non-deleted markers (public)
router.get('/', listMarkers);

// GET /api/markers/mine — list markers owned by the authenticated user (protected)
router.get('/mine', authenticate, listMyMarkers);

// GET /api/markers/:id — get single marker (public)
router.get('/:id', getMarker);

// POST /api/markers — create marker (protected + file upload)
router.post('/', authenticate, upload.single('image'), createMarker);

// PUT /api/markers/:id — edit marker (protected + file upload)
router.put('/:id', authenticate, upload.single('image'), updateMarker);

// DELETE /api/markers/:id — soft-delete marker (protected)
router.delete('/:id', authenticate, deleteMarker);

// Nested contribution routes: /api/markers/:id/contributions
router.use('/:id/contributions', contributionRoutes);

module.exports = router;
