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
const multiparty = require('multiparty');
const fs = require('fs');
app.use(express.json()); // for AJAX

const { spawn } = require('child_process');

// nunjucks Template implimentation
const nunjucks = require('nunjucks');
nunjucks.configure('views', { autoescape: true, express: app }); // 
app.set('view engine', 'njk');

//---------------!!!!!INTEGRATING ALGO BACKTESTER JAVA WITH NODE.JS!!!!!-------------------------
//                          NOT RELATED TO COURSE
/*
        “This section sets up the Node–Java integration.
        It defines where my CSV data and Java backtester live, checks that they exist,
        and ensures there’s always a valid CSV path to run the algorithm.
        Essentially, it’s the backbone that lets my Node.js server execute the Java JAR and feed it data safely.”
 */
const FILES_DIR = require('path').resolve(__dirname, '..', 'data'); // where files live
const JAR_PATH = require('path').resolve(
    __dirname,
    '..',
    'algo-backtester-java',
    'target',
    'algo-backtester-java-1.0.0-jar-with-dependencies.jar'
);
console.log('[INFO] JAR_PATH:', JAR_PATH);
console.log('[INFO] FILES_DIR:', FILES_DIR);
// These console.log can verify that Node.js is pointing to the correct folders when the server is started.
// fs.existsSync() checks whether a file exists on disk.
if (!fs.existsSync(JAR_PATH)) {
    console.warn('[WARN] Backtester JAR not found at:', JAR_PATH);
} else {
    console.log('[OK] Found backtester JAR at:', JAR_PATH);
}


function resolveCsvPath() {  //Choose CSV: prefer last uploaded, else sample.csv in /public
    if (uploadedFile?.path) return uploadedFile.path; // If uploadedFile exists and has a .path property, return the path.
    return path.join(FILES_DIR, 'TSLA.csv'); // Otherwise, default to  TSLA.csv:
}

// ensure data folder exists.   // If it doesn’t, mkdirSync() creates it with recursive: true so even parent folders get created if missing to prevent crash when user upload files
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true });

function runJavaBacktester({ csv, fast, slow, strategy = 'macrossover' }) {
    return new Promise((resolve, reject) => {
        // This array "args" represents the command-line arguments to run in JAR.
        const args = [
            '-jar', JAR_PATH,
            '--csv', csv,
            '--fast', String(fast),
            '--slow', String(slow),
            '--strategy', strategy
        ];
        // spawn() starts a new child process running  Java command.
        const child = spawn('java', args, { stdio: ['ignore', 'pipe', 'pipe'] });

        let stdout = ''; // Capture standard output (stdout) → where Java prints results.
        let stderr = ''; // Capture standard error (stderr) → where Java prints errors/logs.
        
        // These event listeners trigger whenever the Java process writes data.
        child.stdout.on('data', b => stdout += b.toString()); // child.stdout gives you what Java printed with System.out.println()
        child.stderr.on('data', b => stderr += b.toString()); // child.stderr gives you what Java printed with System.err.println()

        child.on('close', code => {
            // If the Java program didn’t exit cleanly, reject the Promise with an error containing Java’s error messages.
            if (code !== 0) return reject(new Error(`Java exited ${code}: ${stderr}`));

            try {
                resolve(JSON.parse(stdout));
            } catch (e) {
                // fallback: grab JSON if engine prints extra text
                const match = stdout.match(/\{[\s\S]*\}$/);
                if (match) {
                    try { return resolve(JSON.parse(match[0])); } catch {}
                }
                reject(new Error(`Invalid JSON output:\n${stdout}\n${stderr}`));
            }
        });
    });
}
//---------------^^^^INTEGRATING ALGO BACKTESTER JAVA WITH NODE.JS^^^^^-------------------------

// Querystring parameters
// to http://localhost:3000/backtest/run?fast=5&slow=20  fast/slow = MOVING Average Trading in stock stratergie
/*
I am doing these querystring as integers because In Algorithmic Backtester, these fast and slow values represent:
Moving average window sizes (e.g. 5-day vs 20-day) They’re used in math calculations
If I don’t convert them to integers, the algorithm would break or give wrong results
because it would be trying to do math with strings, not numbers.
 */

// NUNJUCKS implimented render
app.get('/backtest/run', async (req, res) => {
    try {
        const fast = parseInt(req.query.fast || '5', 10);
        const slow = parseInt(req.query.slow || '20', 10);
        if (!Number.isFinite(fast) || !Number.isFinite(slow) || fast <= 0 || slow <= 0 || fast >= slow) {
            return res.status(400).render('error.njk', {
                title: 'Invalid Parameters',
                code: 400,
                message: 'Use /backtest/run?fast=5&slow=20 with positive integers and fast < slow.'
            });
        }

        const csv = resolveCsvPath();
        const result = await runJavaBacktester({ csv, fast, slow, strategy: 'macrossover' });

        // when JAVA ENGINE RUNS it outputs teh json metrics like this 
/**
         {
                "metrics": {       // overall statistics (trades, total return, etc.)
                    "barsRead": 300,
                    "trades": 6,
                    "totalReturnPct": 12.75
                },

                "series": [.  //  time-series of daily (or weekly) data points.
                    { "date": "2024-01-01", "close": 105, "smaFast": 100, "smaSlow": 102 },
                    { "date": "2024-01-02", "close": 107, "smaFast": 101, "smaSlow": 103 },
                    ...
                    { "date": "2024-06-30", "close": 130, "smaFast": 125, "smaSlow": 120 }
                ],

                "signals": [...]. // buy/sell signal events.
                }
*/
        /**
         *  This loop scans the series data from the Java output starting from the end,
            finds the most recent date and the last computed SMA values for fast and slow averages,
            and stores them so we can display a summary of the latest backtest state on the Nunjucks results page.
            It’s efficient way to always show the freshest computed data.
         */
        const m = result?.metrics || {};  // m holds the metrics from java
        const series = Array.isArray(result?.series) ? result.series : []; // series becomes your full list of rows from Java, or empty if none exist
        let lastFast = 'N/A', lastSlow = 'N/A', lastDate = 'N/A';
        for (let i = series.length - 1; i >= 0; i--) {
            const row = series[i];
            if (row?.date) lastDate = row.date; // If the row has a date, update lastDate.
            if (row?.smaFast !== undefined || row?.smaSlow !== undefined) { // Checking if the row has moving average values.
                //If it does, record them:
                if (row?.smaFast !== undefined) lastFast = row.smaFast;
                if (row?.smaSlow !== undefined) lastSlow = row.smaSlow;
                //once find the most recent valid row, stop — no need to keep looping backward.
                break;
            }
        }

        // After the above loop finishes, we have something like below that will pass to nunjucks
        /**
         *  lastDate = "2024-06-30"
            lastFast = 125
            lastSlow = 120
         */
        // These are used for the summary table on the results page.”
        res.render('backtest-results.njk', {    // Use the Nunjucks template backtest-results.njk 
            title: 'Backtest Results',
            params: { csv, fast, slow },
            metrics: {
                barsRead: m.barsRead ?? 'N/A',
                trades: m.trades ?? 'N/A',
                totalReturnPct: m.totalReturnPct ?? 'N/A',
                lastDate, lastFast, lastSlow
            },
            signals: Array.isArray(result?.signals) ? result.signals : [],
            rawJson: JSON.stringify(result, null, 2)
        });
    } catch (err) {
        console.error(err);
        res.status(500).render('error.njk', {
            title: 'Server Error',
            code: 500,
            message: err.message || 'Unexpected error while running backtest.'
        });
    }
});

// --- 2. Middleware --------------------------------------------

// Middleware for static files and URL encoded
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));


// --- 3. ROUTES ------------------------------------------------

// 2) Serving of static files from a directory
// serving static files from this html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// Querystring parameters
app.get('/backtest', (req, res) =>{
    const fast = parseInt(req.query.fast || '3', 10);  // default = 3  and radix = 10 means base 10 decimal (comp ARC concept)
    const slow = parseInt(req.query.slow || '5', 10);  // default = 5
    if (!Number.isFinite(fast) || !Number.isFinite(slow) || fast <= 0 || slow <= 0 || fast >= slow) {
        return res.status(400).send(`
            <h1>Invalid parameters</h1>
            <p>Please use the format: <b>/backtest?fast=3&slow=5</b></p>
            <p>Ensure both are positive numbers and fast &lt; slow.</p>
            <a href="/">Home</a>
            `);
    }
    res.send(`<h1>Backtest Parameters</h1>
                   <p><b>Fast Moving Average (MA):</b> ${fast}</p>
                   <p><b>Slow Moving Average (MA):</b> ${slow}</p>
            <p>These values will later feed into the moving average strategy.</p>
            <a href="/">Home</a>
  `);
});
// 4) Handle information from http-bodies (url-encoded, or general form-data through a body-parser
app.post('/backtest', (req, res) => {
    const fast = parseInt(req.body.fast || '3', 10);
    const slow = parseInt(req.body.slow || '5', 10);
    if (!Number.isFinite(fast) || !Number.isFinite(slow) || fast <= 0 || slow <= 0 || fast >= slow) {
        return res.status(400).send(`
      <h1>Invalid parameters</h1>
      <p>Submit positive integers with fast &lt; slow.</p>
      <a href="/">Home</a>
    `);
    }
    // For just Now, (algorithm wiring comes later)
    res.send(`
    <h1>Backtest (POST body received)</h1>
    <p><b>Fast MA:</b> ${fast}</p>
    <p><b>Slow MA:</b> ${slow}</p>
    <p>Parsed from req.body using urlencoded parser.</p>
    <a href="/">Home</a>
  `);
});
// downloading the CSV data files using URl

// we used this sanitize so users can’t trick the server into loading dangerous paths like
// ../../../../etc/passwd (which would try to read files outside your project).
function sanitize(filename) {
    // remove slashes and weird characters from files
    // only keeps letters(A-Z), numbers(0-9), dot,dash,- and remove everything else
    return filename.replace(/[^a-zA-Z0-9._-]/g, '');
}
// /files/sampleInData.csv -> trigger a download
app.get('/files/:name', (req, res) => {
    const requested = sanitize(req.params.name || '');
    // If nothing given or bad name
    if (!requested) return res.status(400).send('Invalid filename.');
    res.download(requested, requested, { root: FILES_DIR }, (err) => {
        if (err) {
            // Send proper error if file not found
            if (!res.headersSent) {
                res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
            }
            return;
        }
        console.log(`File downloaded: ${requested}`);
    });
});

// Example route to test 500 error
app.get('/error', (req, res, next) => {
    next(new Error('Simulated server crash 500'));
});

// Example route to test 404 error
app.get('/404', (req, res, next) => {
    next();
});


// 3)  ROUTE PARAMETERS AND Querystring parameters
// go to http://localhost:3000/dataset/TSLA
app.get('/dataset/:symbol', (req, res) => {
    const symbol = req.params.symbol;
    if (!symbol) return res.status(400).send('Invalid symbol.');
    res.send(
        `
    <h1>Selected dataset: ${symbol}</h1>
    <p>This proves route parameters work.</p>
    <a href="/">Home</a>
  `);
});

app.post('/backtest/run', async (req, res) => {
  const fast = parseInt(req.body.fast || '5', 10);
  const slow = parseInt(req.body.slow || '20', 10);

  if (!Number.isFinite(fast) || !Number.isFinite(slow) || fast <= 0 || slow <= 0 || fast >= slow) {
    return res.status(400).render('error.njk', {
      title: 'Invalid Parameters',
      code: 400,
      message: 'Submit positive integers with fast < slow.'
    });
  }

  // Reuse the same logic you have in GET:
  const csv = resolveCsvPath();
  const result = await runJavaBacktester({ csv, fast, slow, strategy: 'macrossover' });

  // derive display helpers (same block you already have)
  const m = result?.metrics || {};
  const series = Array.isArray(result?.series) ? result.series : [];
  let lastFast = 'N/A', lastSlow = 'N/A', lastDate = 'N/A';
  for (let i = series.length - 1; i >= 0; i--) {
    const row = series[i];
    if (row?.date) lastDate = row.date;
    if (row?.smaFast !== undefined || row?.smaSlow !== undefined) {
      if (row?.smaFast !== undefined) lastFast = row.smaFast;
      if (row?.smaSlow !== undefined) lastSlow = row.smaSlow;
      break;
    }
  }

  return res.render('backtest-results.njk', {
    title: 'Backtest Results',
    params: { csv, fast, slow },
    metrics: {
      barsRead: m.barsRead ?? 'N/A',
      trades: m.trades ?? 'N/A',
      totalReturnPct: m.totalReturnPct ?? 'N/A',
      lastDate, lastFast, lastSlow
    },
    signals: Array.isArray(result?.signals) ? result.signals : [],
    rawJson: JSON.stringify(result, null, 2)
  });
});


// 6) B. Upload files via multiparty
const fields = {}; // Stores any text fields (non-file inputs) that come along with the upload.
let uploadedFile = null;
let rejectedFile = false;
app.post('/upload', (req, res) => {
    const form = new multiparty.Form({ uploadDir: FILES_DIR }); // Multiparty form parser
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
            rejectedFile = true;
            try {
                fs.unlinkSync(file.path);
            } catch (err) {
                console.error('Error deleting non-CSV file:', err);
            }
        } else {
            uploadedFile = file;
        }
    });

    form.on('error', (err) => {
        console.error('Multiparty error:', err);
        res
            .status(400)
            .send(`<h1>Upload error</h1><p>${err.message}</p><a href="/">Back</a>`);
    });

    //  When parsing finishes
    form.on('close', () => {
        if (rejectedFile) {
            return res
                .status(400)
                .send('<h1>Only CSV files are allowed </h1><a href="/">Back</a>');
        }

        if (!uploadedFile) {
            return res
                .status(400)
                .send('<h1>No file uploaded</h1><a href="/">Back</a>');
        }


        res.send(`
      <h1> Upload Successful</h1>
      <p><b>Original name:</b> ${uploadedFile.originalFilename }</p>
      <p><b>Saved to:</b> ${uploadedFile.path}</p>
      <p><b>Size:</b> ${uploadedFile.size / 1024} KB</p>
      <a href="/">Home</a>
    `);
    });

    form.parse(req);
});

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