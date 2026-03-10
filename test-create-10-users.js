/*
  Creates 10 new INDIVIDUAL accounts against the deployed API.

  Usage:
    node test-create-10-users.js

  Optional:
    set API_BASE=https://api.kotm.app/api/v1
*/

const DEFAULT_BASE = 'https://api.kotm.app/api/v1';
const API_BASE = (process.env.API_BASE || DEFAULT_BASE).replace(/\/$/, '');

function unwrapApiResponse(json) {
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data;
  }
  return json;
}

async function postJson(path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  let json;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }

  return { status: res.status, ok: res.ok, json };
}

function randomHex(bytes = 4) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function main() {
  console.log(`API_BASE = ${API_BASE}`);

  const password = 'TestUser123!';
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

  const results = [];

  for (let i = 1; i <= 10; i++) {
    const email = `kom.test.${runId}.${i}.${randomHex(3)}@example.com`;

    const registerPayload = {
      email,
      password,
      userType: 'INDIVIDUAL',
      fullName: `Test User ${i}`,
      governorate: 'Test',
      city: 'Test',
    };

    const r = await postJson('/auth/register', registerPayload);
    const unwrapped = unwrapApiResponse(r.json);

    results.push({
      i,
      email,
      registerStatus: r.status,
      registerOk: r.ok,
      registerBody: unwrapped,
    });

    const statusLabel = r.ok ? 'OK' : 'FAIL';
    console.log(`[${i}/10] register ${statusLabel} (${r.status}) - ${email}`);

    if (!r.ok) {
      console.log('  body:', JSON.stringify(r.json, null, 2));
    }
  }

  // Try login only once to avoid /auth/login throttling (limit 5/min)
  const first = results.find((x) => x.registerOk);
  if (first) {
    const loginPayload = { email: first.email, password };
    const lr = await postJson('/auth/login', loginPayload);
    console.log(`\nLogin test for first created user:`);
    console.log(`  status: ${lr.status} (expected 403 until admin approves)`);
    console.log(`  body:`, JSON.stringify(unwrapApiResponse(lr.json), null, 2));
  } else {
    console.log(`\nNo successful registrations; skipping login test.`);
  }

  const okCount = results.filter((x) => x.registerOk).length;
  console.log(`\nSummary: ${okCount}/10 registrations succeeded.`);
  if (okCount !== 10) {
    console.log('Failures:');
    for (const r of results.filter((x) => !x.registerOk)) {
      console.log(`  - #${r.i} ${r.email} -> ${r.registerStatus}`);
    }
  }
}

// Node 20 has WebCrypto globally.
const crypto = globalThis.crypto;
if (!crypto?.getRandomValues) {
  console.error('WebCrypto is not available. Please run with Node.js 20+.');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
