# Hive Compliance Screener (HiveForce-Sentinel)

**HiveForce Wave 1 Super Soldier** — AML/sanctions screening for agent transactions in the Hive Civilization.

## Overview

HiveForce-Sentinel is a headless Node.js/Express ESM microservice that screens agents and transactions for compliance risk. It checks trust scores from HiveTrust, applies amount-based thresholds, and returns risk levels (LOW / MEDIUM / HIGH). On startup it self-registers with HiveTrust and obtains a DID.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check — `{ status, service, version }` |
| `GET` | `/.well-known/hive-pulse.json` | Agent pulse data |
| `GET` | `/.well-known/ai.json` | AI discovery metadata |
| `GET` | `/robots.txt` | Agent-friendly robots |
| `POST` | `/v1/screen/agent` | Screen an agent by DID |
| `POST` | `/v1/screen/transaction` | Screen a transaction |
| `GET` | `/v1/screen/history/:did` | Screening history for a DID |
| `GET` | `/v1/screen/stats` | Aggregate screening statistics |

## Risk Levels

| Level | Meaning |
|-------|---------|
| `LOW` | Trust score ≥ 70 — approve |
| `MEDIUM` | Trust score 40–69 — flag for review |
| `HIGH` | Trust score < 40 or flagged — block |
| `UNKNOWN` | Trust score unavailable |

## Quick Start

```bash
npm install
node src/server.js
```

Environment variables:
- `PORT` — HTTP port (default: `3400`)

## License

MIT
