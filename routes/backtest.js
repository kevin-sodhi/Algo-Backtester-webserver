const express = require('express');
const router = express.Router();

const { resolveCsvPath, runJavaBacktester } = require('../services/javaIntegration');

module.exports = function createBacktestRouter({ getUploadedFile }) {
  // GET /backtest/run
  router.get('/backtest/run', async (req, res) => {
    try {
      const fast = parseInt(req.query.fast || '5', 10);
      const slow = parseInt(req.query.slow || '20', 10);
      if (
        !Number.isFinite(fast) ||
        !Number.isFinite(slow) ||
        fast <= 0 ||
        slow <= 0 ||
        fast >= slow
      ) {
        return res.status(400).render('error.njk', {
          title: 'Invalid Parameters',
          code: 400,
          message: 'Use /backtest/run?fast=5&slow=20 with positive integers and fast < slow.',
        });
      }

      const csv = resolveCsvPath(getUploadedFile?.());
      const result = await runJavaBacktester({ csv, fast, slow, strategy: 'macrossover' });
      const m = result?.metrics || {};
      const series = Array.isArray(result?.series) ? result.series : [];
      let lastFast = 'N/A',
        lastSlow = 'N/A',
        lastDate = 'N/A';
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
          lastDate,
          lastFast,
          lastSlow,
        },
        signals: Array.isArray(result?.signals) ? result.signals : [],
        rawJson: JSON.stringify(result, null, 2),
      });
    } catch (err) {
      console.error(err);
      res.status(500).render('error.njk', {
        title: 'Server Error',
        code: 500,
        message: err.message || 'Unexpected error while running backtest.',
      });
    }
  });

  // POST /backtest/run
  router.post('/backtest/run', async (req, res) => {
    const fast = parseInt(req.body.fast || '5', 10);
    const slow = parseInt(req.body.slow || '20', 10);

    if (
      !Number.isFinite(fast) ||
      !Number.isFinite(slow) ||
      fast <= 0 ||
      slow <= 0 ||
      fast >= slow
    ) {
      return res.status(400).render('error.njk', {
        title: 'Invalid Parameters',
        code: 400,
        message: 'Submit positive integers with fast < slow.',
      });
    }

    const csv = resolveCsvPath(getUploadedFile?.());
    const result = await runJavaBacktester({ csv, fast, slow, strategy: 'macrossover' });

    const m = result?.metrics || {};
    const series = Array.isArray(result?.series) ? result.series : [];
    let lastFast = 'N/A',
      lastSlow = 'N/A',
      lastDate = 'N/A';
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
        lastDate,
        lastFast,
        lastSlow,
      },
      signals: Array.isArray(result?.signals) ? result.signals : [],
      rawJson: JSON.stringify(result, null, 2),
    });
  });

  return router;
};
