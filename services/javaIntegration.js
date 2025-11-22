const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Paths to data folder and built JAR
// __dirname is /Algo-backtester-webserver/services, so go up twice to project root
const FILES_DIR = path.resolve(__dirname, '..', '..', 'data');
const JAR_PATH = path.resolve(
  __dirname,
  '..',
  '..',
  'algo-backtester-java',
  'target',
  'algo-backtester-java-1.0.0-jar-with-dependencies.jar'
);

console.log('[INFO] JAR_PATH:', JAR_PATH);
console.log('[INFO] FILES_DIR:', FILES_DIR);

// Ensure data folder exists for uploads/downloads
if (!fs.existsSync(FILES_DIR)) fs.mkdirSync(FILES_DIR, { recursive: true });

if (!fs.existsSync(JAR_PATH)) {
  console.warn('[WARN] Backtester JAR not found at:', JAR_PATH);
} else {
  console.log('[OK] Found backtester JAR at:', JAR_PATH);
}

function resolveCsvPath(uploadedFile) {
  if (uploadedFile?.path) return uploadedFile.path;
  return path.join(FILES_DIR, 'TSLA.csv');
}

function runJavaBacktester({ csv, fast, slow, strategy = 'macrossover' }) {
  return new Promise((resolve, reject) => {
    const args = [
      '-jar',
      JAR_PATH,
      '--csv',
      csv,
      '--fast',
      String(fast),
      '--slow',
      String(slow),
      '--strategy',
      strategy,
    ];

    const child = spawn('java', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (b) => (stdout += b.toString()));
    child.stderr.on('data', (b) => (stderr += b.toString()));

    child.on('close', (code) => {
      if (code !== 0) return reject(new Error(`Java exited ${code}: ${stderr}`));

      try {
        return resolve(JSON.parse(stdout));
      } catch {
        const match = stdout.match(/\{[\s\S]*\}$/);
        if (match) {
          try {
            return resolve(JSON.parse(match[0]));
          } catch {}
        }
        reject(new Error(`Invalid JSON output:\n${stdout}\n${stderr}`));
      }
    });
  });
}

module.exports = {
  FILES_DIR,
  JAR_PATH,
  resolveCsvPath,
  runJavaBacktester,
};
