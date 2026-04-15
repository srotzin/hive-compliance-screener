import { Router } from 'express';
import { screenAgent, screenTransaction, getHistory, getStats } from '../services/screener.js';
import { hiveClient } from '../services/hive-client.js';

export const screenRouter = Router();

// POST /v1/screen/agent
screenRouter.post('/agent', async (req, res) => {
  const { did } = req.body || {};
  if (!did) {
    return res.status(400).json({ ok: false, error: 'did_required', message: '"did" is required' });
  }
  try {
    const result = await screenAgent(did);
    res.json({ ok: true, data: result, agent_did: hiveClient.did });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'screen_failed', message: err.message });
  }
});

// POST /v1/screen/transaction
screenRouter.post('/transaction', async (req, res) => {
  const { from, to, amount, type } = req.body || {};
  if (!from || !to) {
    return res.status(400).json({ ok: false, error: 'params_required', message: '"from" and "to" are required' });
  }
  try {
    const result = await screenTransaction(from, to, amount, type);
    res.json({ ok: true, data: result, agent_did: hiveClient.did });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'screen_failed', message: err.message });
  }
});

// GET /v1/screen/history/:did
screenRouter.get('/history/:did', (req, res) => {
  const { did } = req.params;
  const entries = getHistory(did);
  res.json({ ok: true, did, count: entries.length, history: entries, agent_did: hiveClient.did });
});

// GET /v1/screen/stats
screenRouter.get('/stats', (_req, res) => {
  const s = getStats();
  res.json({ ok: true, ...s, agent_did: hiveClient.did, timestamp: new Date().toISOString() });
});
