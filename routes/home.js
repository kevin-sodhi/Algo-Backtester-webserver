const path = require('path');
const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');

// Home page
router.get('/old-home', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = router;
