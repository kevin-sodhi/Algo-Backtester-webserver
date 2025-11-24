const path = require('path');
const express = require('express');
const router = express.Router();

// Home page (static HTML for now)
router.get('/old-home', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

module.exports = router;
