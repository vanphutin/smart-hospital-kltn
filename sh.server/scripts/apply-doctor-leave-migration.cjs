/**
 * Áp dụng migrations/doctor-leave-requests.sql lên Postgres (POSTGRES_* trong .env).
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadEnvFile(filePath) {
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    for (const line of text.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq === -1) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* no .env */
  }
}

loadEnvFile(path.join(__dirname, '..', '.env'));

const sqlPath = path.join(__dirname, '..', 'migrations', 'doctor-leave-requests.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

(async () => {
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'sh_user',
    password: process.env.POSTGRES_PASSWORD || 'sh_password',
    database: process.env.POSTGRES_DB || 'smart_hospital',
  });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log('Đã áp dụng migrations/doctor-leave-requests.sql');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
