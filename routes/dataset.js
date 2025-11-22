const express = require('express');
const router = express.Router();

router.get('/dataset/:symbol', (req, res) => {
  const symbol = req.params.symbol;
  if (!symbol) return res.status(400).send('Invalid symbol.');
  res.send(
    `
    <h1>Selected dataset: ${symbol}</h1>
    <p>This proves route parameters work.</p>
    <a href="/">Home</a>
  `
  );
});

module.exports = router;
