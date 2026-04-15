import { Router } from 'express';
import { hiveClient } from '../services/hive-client.js';
import { getStats } from '../services/screener.js';

const BOOT_TIME = new Date().toISOString();

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'operational',
    service: 'hive-compliance-screener',
    version: '1.0.0',
    did: hiveClient.did,
    uptime_seconds: Math.floor(process.uptime()),
    boot_time: BOOT_TIME,
  });
});

healthRouter.get('/.well-known/hive-pulse.json', (_req, res) => {
  const s = getStats();
  res.json({
    schema: 'hive-pulse/v1',
    agent: 'hive-compliance-screener',
    did: hiveClient.did,
    status: 'online',
    boot_time: BOOT_TIME,
    uptime_seconds: Math.floor(process.uptime()),
    capabilities: ['compliance', 'risk_scoring', 'aml_check'],
    screening_stats: s,
    endpoints: {
      screen_agent: 'POST /v1/screen/agent',
      screen_transaction: 'POST /v1/screen/transaction',
      history: 'GET /v1/screen/history/:did',
      stats: 'GET /v1/screen/stats',
      health: 'GET /health',
    },
    pulse_time: new Date().toISOString(),
  });
});

healthRouter.get('/.well-known/ai.json', (_req, res) => {
  res.json({
    schema_version: '1.0',
    name: 'HiveForce-Sentinel',
    description: 'AML/sanctions compliance screening for Hive agent transactions',
    type: 'agent-service',
    did: hiveClient.did,
    capabilities: ['compliance', 'risk_scoring', 'aml_check'],
    api: {
      base_url: '/',
      endpoints: [
        { method: 'POST', path: '/v1/screen/agent', description: 'Screen an agent by DID' },
        { method: 'POST', path: '/v1/screen/transaction', description: 'Screen a transaction' },
        { method: 'GET', path: '/v1/screen/history/:did', description: 'Screening history for a DID' },
        { method: 'GET', path: '/v1/screen/stats', description: 'Aggregate stats' },
        { method: 'GET', path: '/health', description: 'Health check' },
      ],
    },
    contact: 'hive-compliance-screener@hive.agent',
  });
});

healthRouter.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send(
    [
      'User-agent: *',
      'Allow: /',
      '',
      '# HiveForce-Sentinel — AML/compliance screening service',
      `# DID: ${hiveClient.did || 'pending'}`,
    ].join('\n')
  );
});
