'use strict';

const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// TODO: mount routes
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/markers', require('./routes/markerRoutes'));

// TODO: global error handler
// app.use(require('./middleware/errorHandler'));

module.exports = app;
