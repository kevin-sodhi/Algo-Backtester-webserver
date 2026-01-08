/**
 *  KEVIN SODHI
 *  ST# 3194463
 *  ADV INTERNET PROGRAMING FINAL PROJECT
 */


// to start the server:
// make sure we are in intergrated terminal of Algo-backtester-webserver
// bash --  npm run dev ---  or --- nodemon AlgoBacktester.js --- 
// if want to go to route /backtest-run need to have java installed 


// AlgoBacktester.js
// ------------------------------------------------------------
// Main entry point for the Algo Backtester webserver.
// Responsibilities:
//  - Configure Express (views, static files, middleware)
//  - Set up cookie-based sessions
//  - Wire routes (auth, uploads, backtest, files, home)
//  - Connect to MongoDB Atlas and reset the `users` collection
//  - Start HTTPS server with local self-signed certificate
// ------------------------------------------------------------
const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const session = require('express-session');

const app = express();
const PORT = 3000; 

// ------------------------------------------------------------
// 1) Service + route imports
// ------------------------------------------------------------

// Java backtester integration(Not part of this course)
const { FILES_DIR } = require('./services/javaIntegration');    // goes to services/javaIntegration.js

// Routers
const createBacktestRouter = require('./routes/backtest');
const homeRouter = require('./routes/home');
const backtestLegacyRouter = require('./routes/backtestLegacy');
const createFilesRouter = require('./routes/files');
const datasetRouter = require('./routes/dataset');
const createUploadsRouter = require('./routes/uploads');
const authRouter = require('./routes/auth');


// MongoDB setup (connect + JSON Schema validation for `users`)
// { connectDBAndResetUsers } pulls connectDBAndResetUsers() from db.js
const { connectDBAndResetUsers } = require('./Database/db');

// ------------------------------------------------------------
// 2) HTTPS certificate setup
// ------------------------------------------------------------
// Uses a self-signed certificate for local HTTPS. `key.pem` and `cert.pem`
// are generated on my machine and placed in this folder.

const certificates = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

// ------------------------------------------------------------
// 3) View engine (Pug templates)
// ------------------------------------------------------------
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// ------------------------------------------------------------
// 4) Global middleware
// ------------------------------------------------------------

// Serve static files (CSS, JS, images, plain HTML) from /public
app.use('/public', express.static(path.join(__dirname, 'public')));

// Parse URL-encoded form bodies (login/signup forms, backtest form)
app.use(express.urlencoded({ extended: true }));

// Parse JSON bodies (for AJAX preview route)
app.use(express.json());


// Cookie-based session setup (server-side session store: MemoryStore)
// - A `connect.sid` cookie is sent to the browser.
// - Session data (req.session.user, etc.) is stored in memory on the server.
app.use(
  session({
    secret: 'beckisbest',          // used to sign session cookie
    cookie: {
      httpOnly: true,              // not accessible via client-side JS
      maxAge: 1000 * 60 * 10       // 10 minutes
    }
  })
);

// ------------------------------------------------------------
// 5) In-memory state for uploads (for assignment/demo purposes)
// ------------------------------------------------------------
// `uploadedFile` holds last successfully uploaded CSV filename.
// `rejectedFile` tracks whether the last upload was rejected.
// `fields` can hold extra form fields if needed.
const fields = {};
let uploadedFile = null;
let rejectedFile = false;

// ------------------------------------------------------------
// 6) Top-level routes
// ------------------------------------------------------------

// Redirect root to the login page
app.get('/', (req, res) => {
  res.redirect('/login');
});


// Backtest routes (calls the Java engine, renders backtest-results.pug)
const backtestRouter = createBacktestRouter({
  getUploadedFile: () => uploadedFile
});
app.use(backtestRouter);

// Home route (protected by requireAuth inside homeRouter)
app.use(homeRouter);

// Legacy demo routes from the assignment (query params / route params, etc.)
app.use(backtestLegacyRouter);
app.use(datasetRouter);

// File download routes (serves CSVs from FILES_DIR)
app.use(createFilesRouter({ FILES_DIR }));

// Upload routes (handle CSV uploads, enforce CSV-only, update `uploadedFile`)
app.use(
  createUploadsRouter({
    FILES_DIR,
    fields,
    getUploadedFile: () => uploadedFile,
    setUploadedFile: (f) => {
      uploadedFile = f;
    },
    getRejectedFlag: () => rejectedFile,
    setRejectedFlag: (v) => {
      rejectedFile = v;
    }
  })
);

// Authentication routes (signup, login, logout, session creation)
app.use(authRouter);

// ------------------------------------------------------------
// 7) AJAX demo route: backtest parameter preview (no Java call)
// ------------------------------------------------------------
// This route validates the fast/slow MA inputs and returns JSON.
// Used to demonstrate an AJAX-style interaction.

app.post('/api/backtest-preview', (req, res) => {
  const fast = parseInt(req.body.fast, 10);
  const slow = parseInt(req.body.slow, 10);

  if (!Number.isFinite(fast) || !Number.isFinite(slow) || fast <= 0 || slow <= 0 || fast >= slow) {
    return res.status(400).json({
      ok: false,
      message: 'Use positive integers and ensure fast MA < slow MA.'
    });
  }

  res.json({
    ok: true,
    fast,
    slow,
    note: 'These parameters are valid and ready for backtest.'
  });
});


// ------------------------------------------------------------
// 8) Custom error handlers (404 and 500)
// ------------------------------------------------------------

// 404 handler – serve custom 404.html for unknown routes
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// 500 handler – catch server errors and serve custom 500.html
// Needs 4 parameters so Express recognizes it as an error handler.
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
});

// ------------------------------------------------------------
// 9) Connect to MongoDB Atlas and start HTTPS server
// ------------------------------------------------------------
// - connectDBAndResetUsers() connects via Mongoose and
//   drops/recreates the `users` collection with JSON Schema validation.
// - Only after the DB is ready, we start the HTTPS server.

connectDBAndResetUsers()
  .then(() => {
    https.createServer(certificates, app).listen(PORT, () => {
      console.log(`HTTPS app listening on https://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

  