'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const { createContribution, listContributions } = require('../controllers/contributionController');
const { authenticate } = require('../middleware/auth');

// POST /api/markers/:id/contributions — create contribution (protected)
router.post('/', authenticate, createContribution);

// GET /api/markers/:id/contributions — list contributions (protected, owner only)
router.get('/', authenticate, listContributions);

module.exports = router;
