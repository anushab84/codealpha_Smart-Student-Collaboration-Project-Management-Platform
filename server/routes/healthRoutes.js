const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint returning system & database status
 * @access  Public
 */
router.get('/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;

  res.status(isDbConnected ? 200 : 503).json({
    success: true,
    message: 'CollabHub backend is running',
    database: isDbConnected ? 'MongoDB' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
