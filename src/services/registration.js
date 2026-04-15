import { hiveClient } from './hive-client.js';

export async function registerOnStartup() {
  console.log('[registration] Registering with HiveTrust...');
  try {
    await hiveClient.register();
  } catch (err) {
    console.error(`[registration] HiveTrust failed: ${err.message}`);
    hiveClient.did = `did:hive:sentinel-fallback-${Date.now()}`;
  }
  console.log('[registration] Onboarding with HiveGate...');
  await hiveClient.onboardGate();
}
