'use strict';

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/markers', require('./routes/markerRoutes'));

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] ?? 'unknown';
  res.json({
    status: 'API funcionando correctamente 🚀',
    db: dbStatus,
  });
});

// Global error handler (must be last middleware)
app.use(require('./middleware/errorHandler'));

module.exports = app;
