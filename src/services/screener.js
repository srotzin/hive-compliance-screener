import { hiveClient } from './hive-client.js';

// In-memory screening history (per-process)
const history = [];

// Risk thresholds
const TRUST_THRESHOLDS = {
  LOW: 70,      // trust_score >= 70 → LOW risk
  MEDIUM: 40,   // trust_score 40–69 → MEDIUM risk
  // < 40 → HIGH risk
};

const AMOUNT_THRESHOLDS = {
  HIGH: 10000,   // >= $10k → flag HIGH
  MEDIUM: 1000,  // >= $1k → flag MEDIUM
};

const HIGH_RISK_TYPES = new Set(['mixer', 'darknet', 'sanctioned', 'unknown']);

function _trustToRisk(score) {
  if (score == null) return 'UNKNOWN';
  if (score >= TRUST_THRESHOLDS.LOW) return 'LOW';
  if (score >= TRUST_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'HIGH';
}

function _amountRisk(amount) {
  if (amount >= AMOUNT_THRESHOLDS.HIGH) return 'HIGH';
  if (amount >= AMOUNT_THRESHOLDS.MEDIUM) return 'MEDIUM';
  return 'LOW';
}

function _mergeRisk(...risks) {
  if (risks.includes('HIGH')) return 'HIGH';
  if (risks.includes('MEDIUM')) return 'MEDIUM';
  return 'LOW';
}

function _record(entry) {
  history.unshift({ ...entry, screened_at: new Date().toISOString() });
  if (history.length > 1000) history.pop();
  // Log to HiveMind async (fire-and-forget)
  hiveClient.storeMemory({ type: 'compliance_screen', ...entry }).catch(() => {});
}

export async function screenAgent(did) {
  if (!did) throw new Error('did is required');

  let trust_score = null;
  let trust_data = null;
  let flags = [];

  try {
    trust_data = await hiveClient.getTrustScore(did);
    trust_score = trust_data?.trust_score ?? trust_data?.score ?? trust_data?.reputation_score ?? null;
  } catch (_) { /* handled below */ }

  if (trust_score == null) flags.push('trust_score_unavailable');

  const risk_level = trust_score != null ? _trustToRisk(trust_score) : 'UNKNOWN';
  if (risk_level === 'HIGH') flags.push('low_trust_score');

  const result = {
    type: 'agent_screen',
    did,
    risk_level,
    trust_score,
    flags,
    recommendation: risk_level === 'HIGH' ? 'block' : risk_level === 'MEDIUM' ? 'review' : 'approve',
  };

  _record(result);
  return result;
}

export async function screenTransaction(from, to, amount, type) {
  if (!from || !to) throw new Error('from and to DIDs are required');
  const numAmount = Number(amount) || 0;

  let flags = [];

  // Parallel trust checks
  const [fromTrust, toTrust] = await Promise.allSettled([
    hiveClient.getTrustScore(from),
    hiveClient.getTrustScore(to),
  ]);

  const fromScore = fromTrust.status === 'fulfilled'
    ? (fromTrust.value?.trust_score ?? fromTrust.value?.score ?? null) : null;
  const toScore = toTrust.status === 'fulfilled'
    ? (toTrust.value?.trust_score ?? toTrust.value?.score ?? null) : null;

  const fromRisk = _trustToRisk(fromScore);
  const toRisk = _trustToRisk(toScore);
  const amountRisk = _amountRisk(numAmount);

  if (fromRisk === 'HIGH') flags.push('sender_low_trust');
  if (toRisk === 'HIGH') flags.push('receiver_low_trust');
  if (amountRisk === 'HIGH') flags.push('large_transaction');
  if (HIGH_RISK_TYPES.has((type || '').toLowerCase())) flags.push('high_risk_transaction_type');
  if (from === to) flags.push('self_transaction');

  const combined_risk = _mergeRisk(fromRisk, toRisk, amountRisk);

  const result = {
    type: 'transaction_screen',
    from,
    to,
    amount: numAmount,
    transaction_type: type || 'transfer',
    risk_level: combined_risk,
    from_risk: fromRisk,
    to_risk: toRisk,
    amount_risk: amountRisk,
    from_trust_score: fromScore,
    to_trust_score: toScore,
    flags,
    recommendation: combined_risk === 'HIGH' ? 'block' : combined_risk === 'MEDIUM' ? 'review' : 'approve',
  };

  _record(result);
  return result;
}

export function getHistory(did) {
  if (did) {
    return history.filter((h) => h.did === did || h.from === did || h.to === did);
  }
  return history.slice(0, 100);
}

export function getStats() {
  const total = history.length;
  const byRisk = { LOW: 0, MEDIUM: 0, HIGH: 0, UNKNOWN: 0 };
  for (const h of history) {
    byRisk[h.risk_level] = (byRisk[h.risk_level] || 0) + 1;
  }
  const pass_rate = total > 0 ? ((byRisk.LOW) / total).toFixed(4) : 0;
  return {
    total_screenings: total,
    by_risk_level: byRisk,
    pass_rate: Number(pass_rate),
    blocked: byRisk.HIGH,
    flagged_for_review: byRisk.MEDIUM,
  };
}
