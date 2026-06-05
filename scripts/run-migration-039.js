const fs = require('fs');
const path = require('path');

for (const line of fs.readFileSync(path.resolve(__dirname, '..', '.env.local'), 'utf8').split(/\r?\n/)) {
  const i = line.indexOf('=');
  if (i > 0 && !line.startsWith('#')) process.env[line.substring(0, i).trim()] = line.substring(i + 1).trim();
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function runSQL(sql) {
  const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
  const res = await fetch(`https://${projectRef}.supabase.co/pg`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SQL failed (${res.status}): ${text}`);
  }
  return res.json();
}

(async () => {
  try {
    await runSQL('ALTER TABLE gacha_products ADD COLUMN IF NOT EXISTS prize_display_name TEXT');
    console.log('Column added!');
  } catch (e) {
    console.log('pg endpoint not available, trying alternative...');
    // Supabase Management API
    const projectRef = SUPABASE_URL.replace('https://', '').split('.')[0];
    const res = await fetch(`https://${projectRef}.supabase.co/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({}),
    });
    console.log('Alt status:', res.status);
  }
})().catch(e => { console.error(e.message); process.exit(1); });
