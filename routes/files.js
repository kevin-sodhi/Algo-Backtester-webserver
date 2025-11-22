const express = require('express');
const path = require('path');

function sanitize(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '');
}

module.exports = function createFilesRouter({ FILES_DIR }) {
  const router = express.Router();

  router.get('/files/:name', (req, res) => {
    const requested = sanitize(req.params.name || '');
    if (!requested) return res.status(400).send('Invalid filename.');
    res.download(requested, requested, { root: FILES_DIR }, (err) => {
      if (err) {
        if (!res.headersSent) {
          res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html'));
        }
        return;
      }
      console.log(`File downloaded: ${requested}`);
    });
  });

  return router;
};
