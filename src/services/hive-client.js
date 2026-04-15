const HIVE_INTERNAL_KEY = 'hive_internal_125e04e071e8829be631ea0216dd4a0c9b707975fcecaf8c62c6a2ab43327d46';

const HIVE_SERVICES = {
  trust: 'https://hivetrust.onrender.com',
  gate: 'https://hivegate.onrender.com',
  mind: 'https://hivemind-1-52cw.onrender.com',
  forge: 'https://hiveforge-lhu4.onrender.com',
  execute: 'https://hive-execute.onrender.com',
};

class HiveClient {
  constructor() {
    this.did = null;
    this.agentName = 'HiveForce-Sentinel';
  }

  _headers() {
    return {
      'Content-Type': 'application/json',
      'x-hive-internal': HIVE_INTERNAL_KEY,
    };
  }

  async _fetch(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { ...this._headers(), ...(options.headers || {}) },
    });
    const text = await res.text().catch(() => '');
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!res.ok) throw new Error(`Hive API ${res.status}: ${text.slice(0, 200)}`);
    return json;
  }

  async register() {
    const data = await this._fetch(`${HIVE_SERVICES.trust}/v1/register`, {
      method: 'POST',
      body: JSON.stringify({
        name: this.agentName,
        purpose: 'AML/sanctions screening for agent transactions',
        capabilities: ['compliance', 'risk_scoring', 'aml_check'],
      }),
    });
    this.did = data.did || data.agent_did || data.id || data.data?.did || data.data?.agent_did;
    console.log(`[hive-client] Registered — DID: ${this.did}`);
    return data;
  }

  async onboardGate() {
    try {
      const data = await this._fetch(`${HIVE_SERVICES.gate}/v1/gate/onboard`, {
        method: 'POST',
        body: JSON.stringify({
          agent_name: 'hive-compliance-screener',
          purpose: 'AML/sanctions screening',
        }),
      });
      console.log('[hive-client] Onboarded with HiveGate');
      return data;
    } catch (err) {
      console.warn(`[hive-client] HiveGate onboard failed (non-fatal): ${err.message}`);
      return null;
    }
  }

  async getTrustScore(did) {
    try {
      const data = await this._fetch(`${HIVE_SERVICES.trust}/v1/trust/${encodeURIComponent(did)}`);
      return data;
    } catch (err) {
      console.warn(`[hive-client] getTrustScore failed for ${did}: ${err.message}`);
      return null;
    }
  }

  async storeMemory(payload) {
    if (!this.did) return null;
    try {
      return await this._fetch(`${HIVE_SERVICES.mind}/v1/memory/${this.did}/store`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn(`[hive-client] storeMemory failed: ${err.message}`);
      return null;
    }
  }

  async queryMemory(params = {}) {
    if (!this.did) return null;
    try {
      const qs = new URLSearchParams(params).toString();
      return await this._fetch(`${HIVE_SERVICES.mind}/v1/memory/${this.did}/query?${qs}`);
    } catch (err) {
      console.warn(`[hive-client] queryMemory failed: ${err.message}`);
      return null;
    }
  }
}

export const hiveClient = new HiveClient();
