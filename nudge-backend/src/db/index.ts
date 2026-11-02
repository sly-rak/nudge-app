import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error', err);
});

export async function query<T extends pg.QueryResultRow = any>(text: string, params?: any[]): Promise<pg.QueryResult<T>> {
  const start = Date.now();
  try {
    const res = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    if (config.nodeEnv === 'development' && duration > 100) {
      console.log('Executed query', { text: text.slice(0, 100), duration, rows: res.rowCount });
    }
    return res;
  } catch (err: any) {
    if (err?.code === 'ECONNRESET' || err?.message?.includes('Connection terminated') || err?.message?.includes('closed')) {
      console.warn('[DB] Connection reset detected, retrying query once...', err.message);
      const res = await pool.query<T>(text, params);
      return res;
    }
    throw err;
  }
}
