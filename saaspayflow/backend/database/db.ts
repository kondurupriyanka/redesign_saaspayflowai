// ============= DATABASE CONNECTION =============
// Uses PostgreSQL via DATABASE_URL env variable

import pkg from 'pg';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  console.warn('[db] ⚠️  DATABASE_URL is not set — database queries will fail. Set it in backend/.env');
}

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  : null;

// Test connection on startup (non-fatal)
if (pool) {
  pool.connect()
    .then((client) => {
      return client.query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = $1', ['public'])
        .then((res) => {
          console.log(`[db] ✅ Connected to PostgreSQL — ${res.rows[0].count} tables in public schema`);
          client.release();
        })
        .catch((err) => {
          client.release();
          console.warn('[db] ⚠️  Table check failed:', err.message);
        });
    })
    .catch((err) => {
      console.warn('[db] ⚠️  Connection failed:', err.message);
    });

  pool.on('error', (err) => {
    console.error('[db] Unexpected pool error:', err.message);
  });
}

export const query = async (text: string, params?: any[]) => {
  if (!pool) {
    throw new Error('Database not configured. Please set DATABASE_URL in backend/.env');
  }
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn('[db] Slow query:', text.substring(0, 80), `(${duration}ms)`);
    }
    return result;
  } catch (err: any) {
    console.error('[db] Query error:', err.message, '| Query:', text.substring(0, 100));
    throw err;
  }
};

export default pool;
