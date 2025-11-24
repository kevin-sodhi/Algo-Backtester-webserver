const express = require('express');
const multiparty = require('multiparty');
const fs = require('fs');

/**
 * Uploads router. Expects state mutators/accessors so the main app can track last upload.
 */
module.exports = function createUploadsRouter({
  FILES_DIR,
  fields,
  getUploadedFile,
  setUploadedFile,
  getRejectedFlag,
  setRejectedFlag,
}) {
  const router = express.Router();

  router.post('/upload', (req, res) => {
    // reset flags per request
    setRejectedFlag(false);
    setUploadedFile(null);

    const form = new multiparty.Form({ uploadDir: FILES_DIR });

    form.on('field', (name, value) => {
      fields[name] = value;
    });

    form.on('file', (name, file) => {
      console.log(`Received file: ${file.originalFilename}`);

      const isCsv =
        /\.csv$/i.test(file.originalFilename) ||
        /csv/i.test(file.headers['content-type'] || '');
      if (!isCsv) {
        console.log(` -Rejected non-CSV file: ${file.originalFilename}`);
        setRejectedFlag(true);
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error deleting non-CSV file:', err);
        }
      } else {
        setUploadedFile(file);
      }
    });

    form.on('error', (err) => {
      console.error('Multiparty error:', err);
      res
        .status(400)
        .send(`<h1>Upload error</h1><p>${err.message}</p><a href="/old-home">Back</a>`);
    });

    form.on('close', () => {
      if (getRejectedFlag() === true) {
        return res
          .status(400)
          .send('<h1>Only CSV files are allowed </h1><a href="/old-home">Back</a>');
      }

      const uploaded = getUploadedFile();
      if (!uploaded) {
        return res
          .status(400)
          .send('<h1>No file uploaded</h1><a href="/old-home">Back</a>');
      }

      res.send(`
      <h1> Upload Successful</h1>
      <p><b>Original name:</b> ${uploaded.originalFilename }</p>
      <p><b>Saved to:</b> ${uploaded.path}</p>
      <p><b>Size:</b> ${uploaded.size / 1024} KB</p>
      <a href="/">Home</a>
    `);
    });

    form.parse(req);
  });

  return router;
};
