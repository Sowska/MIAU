'use strict';

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

// Middleware
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
// Marker routes — contribution routes are nested inside markerRoutes
// as /api/markers/:id/contributions (see routes/markerRoutes.js)
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
