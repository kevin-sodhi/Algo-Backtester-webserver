const express = require('express');
const router = express.Router();

// Querystring echo for backtest params (legacy demo)
router.get('/backtest', (req, res) => {
  const fast = parseInt(req.query.fast || '3', 10);
  const slow = parseInt(req.query.slow || '5', 10);
  if (!Number.isFinite(fast) || !Number.isFinite(slow) || fast <= 0 || slow <= 0 || fast >= slow) {
    return res.status(400).send(`
            <h1>Invalid parameters</h1>
            <p>Please use the format: <b>/backtest?fast=3&slow=5</b></p>
            <p>Ensure both are positive numbers and fast &lt; slow.</p>
            <a href="/old-home">Home</a>
            `);
  }
  res.send(`<h1>Backtest Parameters</h1>
                   <p><b>Fast Moving Average (MA):</b> ${fast}</p>
                   <p><b>Slow Moving Average (MA):</b> ${slow}</p>
            <p>These values will later feed into the moving average strategy.</p>
            <a href="/old-home">Home</a>
  `);
});

// POST echo for backtest params (legacy demo)
router.post('/backtest', (req, res) => {
  const fast = parseInt(req.body.fast || '3', 10);
  const slow = parseInt(req.body.slow || '5', 10);
  if (!Number.isFinite(fast) || !Number.isFinite(slow) || fast <= 0 || slow <= 0 || fast >= slow) {
    return res.status(400).send(`
      <h1>Invalid parameters</h1>
      <p>Submit positive integers with fast &lt; slow.</p>
      <a href="/old-home">Home</a>
    `);
  }
  res.send(`
    <h1>Backtest (POST body received)</h1>
    <p><b>Fast MA:</b> ${fast}</p>
    <p><b>Slow MA:</b> ${slow}</p>
    <p>Parsed from req.body using urlencoded parser.</p>
    <a href="/old-home">Home</a>
  `);
});

module.exports = router;
