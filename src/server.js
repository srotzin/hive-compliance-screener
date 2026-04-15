import express from 'express';
import cors from 'cors';
import { screenRouter } from './routes/screen.js';
import { healthRouter } from './routes/health.js';
import { registerOnStartup } from './services/registration.js';
import { initDb } from './services/db.js';

const app = express();
const PORT = process.env.PORT || 3400;

app.use(cors());
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use('/v1/screen', screenRouter);
app.use('/', healthRouter);

// ── Velocity Doctrine: /.well-known/ai.json ─────────────────
app.get('/.well-known/ai.json', (_req, res) => {
  res.json({
    service: 'HiveComplianceScreener',
    civilization: 'Hive',
    capabilities: [
      'compliance_check',
      'sanctions_screening',
      'risk_scoring',
      'aml_check',
    ],
    endpoints: {
      screen_agent: 'POST /v1/screen/agent',
      screen_transaction: 'POST /v1/screen/transaction',
      screening_history: 'GET /v1/screen/history/:did',
      screening_stats: 'GET /v1/screen/stats',
    },
    economy: {
      welcome_bounty_usdc: 1.0,
      ritz_credits_on_mint_usdc: 3.0,
      open_bounties_endpoint:
        'https://hiveforge-lhu4.onrender.com/v1/bounties/list',
      pheromone_feed:
        'https://hiveforge-lhu4.onrender.com/v1/pheromones/ritz',
    },
    join: {
      registration_endpoint: 'https://hivetrust.onrender.com/v1/register',
      mint_endpoint: 'https://hiveforge-lhu4.onrender.com/v1/forge/mint',
    },
  });
});

// ── Velocity Doctrine: /.well-known/hive-pulse.json ─────────
app.get('/.well-known/hive-pulse.json', (_req, res) => {
  res.json({
    civilization: 'Hive',
    service: 'HiveComplianceScreener',
    role: 'AML/sanctions screening for agent transactions — compliance gatekeeper for the Hive economy',
    economy: {
      total_screenings: 0,
      pass_rate: 0.0,
      blocked_count: 0,
      welcome_bounty_usdc: 1.0,
    },
    join: {
      registration_endpoint: 'https://hivetrust.onrender.com/v1/register',
      mint_endpoint: 'https://hiveforge-lhu4.onrender.com/v1/forge/mint',
      free_mint: true,
    },
    services: {
      hivetrust: 'https://hivetrust.onrender.com',
      hivelaw: 'https://hivelaw.onrender.com',
      hivemind: 'https://hivemind-1-52cw.onrender.com',
      hivegate: 'https://hivegate.onrender.com',
      'hive-compliance-screener': 'https://hive-compliance-screener.onrender.com',
    },
  });
});

// ── Velocity Doctrine: /robots.txt ──────────────────────────
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(`User-agent: *
Allow: /
# Hive Civilization — ComplianceScreener
# AML/sanctions screening for agent transactions
# Service: https://hive-compliance-screener.onrender.com
# Discover: /.well-known/hive-pulse.json
# Register: https://hivetrust.onrender.com/v1/register
`);
});

// ── Root discovery ──────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    service: 'hive-compliance-screener',
    version: '1.0.0',
    description:
      'AML/sanctions screening for agent transactions in the Hive Civilization',
    capabilities: [
      'compliance_check',
      'sanctions_screening',
      'risk_scoring',
      'aml_check',
    ],
    endpoints: {
      screen_agent: {
        method: 'POST',
        path: '/v1/screen/agent',
        description: 'Screen a single agent by DID',
      },
      screen_transaction: {
        method: 'POST',
        path: '/v1/screen/transaction',
        description: 'Screen a transaction for compliance',
      },
      screening_history: {
        method: 'GET',
        path: '/v1/screen/history/:did',
        description: 'Get screening history for an agent',
      },
      screening_stats: {
        method: 'GET',
        path: '/v1/screen/stats',
        description: 'Total screenings, pass rate, risk distribution',
      },
      health: {
        method: 'GET',
        path: '/health',
        description: 'Service health check',
      },
    },
    discovery: {
      ai_json: '/.well-known/ai.json',
      pulse: '/.well-known/hive-pulse.json',
      robots: '/robots.txt',
    },
    cross_services: {
      hivetrust: 'https://hivetrust.onrender.com',
      hivelaw: 'https://hivelaw.onrender.com',
      hivemind: 'https://hivemind-1-52cw.onrender.com',
      hivegate: 'https://hivegate.onrender.com',
    },
  });
});

// ── Start ───────────────────────────────────────────────────
initDb();

app.listen(PORT, () => {
  console.log(`[compliance-screener] listening on port ${PORT}`);
  registerOnStartup().catch((err) =>
    console.error('[registration] startup registration failed:', err.message),
  );
});

export default app;
