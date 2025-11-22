// to start the server:
// nodemon AlgoBacktester.js
//cd "/Users/kevinsodhi/Library/CloudStorage/OneDrive-UniversityofWinnipeg/ALGO JAVA PROJECT/Algo-backtester-webserver"
// nodemon AlgoBacktester.js
// npm run dev
//  --- 1.  SETUP ---------------------------------------------------
const express = require('express');
const app = express();
const path = require('path');
const PORT = 3000;
const { FILES_DIR } = require('./services/javaIntegration');
const createBacktestRouter = require('./routes/backtest');
const homeRouter = require('./routes/home');
const backtestLegacyRouter = require('./routes/backtestLegacy');
const createFilesRouter = require('./routes/files');
const datasetRouter = require('./routes/dataset');
const createUploadsRouter = require('./routes/uploads');
app.use(express.json()); // for AJAX

// nunjucks Template implimentation
const nunjucks = require('nunjucks');
nunjucks.configure('views', { autoescape: true, express: app }); // 
app.set('view engine', 'njk');

const fields = {}; // Stores any text fields (non-file inputs) that come along with the upload.
let uploadedFile = null;
let rejectedFile = false;

// --- 2. Middleware --------------------------------------------

// Middleware for static files and URL encoded
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Backtest routes (uses Java integration service)
const backtestRouter = createBacktestRouter({ getUploadedFile: () => uploadedFile });
app.use(backtestRouter);
app.use(homeRouter);
app.use(backtestLegacyRouter);
app.use(createFilesRouter({ FILES_DIR }));
app.use(datasetRouter);
app.use(createUploadsRouter({
    FILES_DIR,
    fields,
    getUploadedFile: () => uploadedFile,
    setUploadedFile: (f) => { uploadedFile = f; },
    getRejectedFlag: () => rejectedFile,
    setRejectedFlag: (v) => { rejectedFile = v; },
}));


// --- 3. ROUTES ------------------------------------------------
// 7) AJAX USING FETCH()
// after reciving the jSON from the script "fast": 3, "slow": 5
app.post('/api/backtest-preview', (req, res) => {
    const fast = parseInt(req.body.fast, 10);
    const slow = parseInt(req.body.slow, 10);

    if (!Number.isFinite(fast) || !Number.isFinite(slow) || fast <= 0 || slow <= 0 || fast >= slow) {
        return res.status(400).json({ ok: false, message: 'Use positive integers and fast MA < slow MA' });
    }
    // TEMP SENDING TO JSON (MA logic for later)
    res.json({
        ok: true,
        fast,
        slow,
        note: 'These parameters are valid and ready for backtest.'
    });
});

// --- 4. Custom Handlers-----------------------------------------------

// 1) • Custom 404- and 500-handlers
// Custom 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Custom 500  (4 parameters)
// we need all 4 arguments because if we only have (req, res), Express thinks it’s a normal route (like 404).
// now express will recognize it as error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err.message);
    res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
