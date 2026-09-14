import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

let supabaseClient = null;

/**
 * Helper internal untuk mengambil Environment Variable dari berbagai platform
 * (Vercel, Railway, Vite, Next.js, CRA, VPS, dll.)
 */
function getEnv(key) {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key];
    if (process.env[`VITE_${key}`]) return process.env[`VITE_${key}`];
    if (process.env[`NEXT_PUBLIC_${key}`]) return process.env[`NEXT_PUBLIC_${key}`];
    if (process.env[`REACT_APP_${key}`]) return process.env[`REACT_APP_${key}`];
  }
  return '';
}

/**
 * Returns a configured Supabase client or null if env is not provided.
 * Uses lazy initialization so that missing credentials never crash the server.
 */
export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const url = getEnv('SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || 
              getEnv('SUPABASE_ANON_KEY') || 
              getEnv('SUPABASE_KEY');

  if (!url || !key) {
    return null;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    return supabaseClient;
  } catch (err) {
    console.warn('[Supabase] Client initialization failed:', err.message);
    return null;
  }
}

export function isSupabaseEnabled() {
  const url = getEnv('SUPABASE_URL');
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_ANON_KEY') || getEnv('SUPABASE_KEY');
  return Boolean(url && key && url.startsWith('http'));
}

/**
 * Executes a raw SQL query or multi-statement DDL against Supabase.
 * Supports:
 * 1. Direct PostgreSQL connection via SUPABASE_DB_URL, DATABASE_URL, POSTGRES_URL, etc.
 * 2. Supabase pg/query REST API using SUPABASE_SERVICE_ROLE_KEY
 */
export async function executeSupabaseSql(sqlQuery) {
  // Dukungan komprehensif untuk string koneksi database dari Railway, Vercel, Heroku, VPS, dll.
  const dbUrl = process.env.SUPABASE_DB_URL || 
                process.env.DATABASE_URL || 
                process.env.DATABASE_PRIVATE_URL || 
                process.env.POSTGRES_URL || 
                process.env.POSTGRES_URL_NON_POOLING;

  const supabaseUrl = getEnv('SUPABASE_URL');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_ANON_KEY');

  // 1. Try direct PostgreSQL connection if connection string is provided
  if (dbUrl) {
    let client;
    try {
      const isSSLRequired = !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1');
      
      client = new pg.Client({
        connectionString: dbUrl,
        connectionTimeoutMillis: 10000,
        ssl: isSSLRequired ? { rejectUnauthorized: false } : false
      });
      
      await client.connect();
      const res = await client.query(sqlQuery);
      await client.end();
      
      return {
        success: true,
        method: 'direct_postgres',
        rowCount: res.rowCount,
        message: 'SQL berhasil dieksekusi via direct PostgreSQL connection!'
      };
    } catch (pgErr) {
      if (client) {
        try { await client.end(); } catch (_) {}
      }
      console.warn('[Supabase SQL] Direct PG attempt notice:', pgErr.message);
    }
  }

  // 2. Try Supabase pg/query HTTP endpoint
  if (supabaseUrl && serviceRoleKey) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/$/, '')}/pg/query`;
      
      // Mendukung native fetch maupun cross-fetch / node-fetch di Node.js lama
      const fetchApi = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;

      const resp = await fetchApi(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ query: sqlQuery })
      });

      if (resp.ok) {
        return {
          success: true,
          method: 'supabase_pg_query',
          message: 'SQL berhasil dieksekusi via Supabase pg-meta API!'
        };
      }
    } catch (httpErr) {
      console.warn('[Supabase SQL] HTTP query endpoint notice:', httpErr.message);
    }
  }

  return {
    success: false,
    method: 'none',
    message: 'Direct SQL execution requires SUPABASE_DB_URL or SUPABASE_SERVICE_ROLE_KEY.'
  };
}

/**
 * 1-Click Automatic Table Creator for Supabase:
 * Automatically creates all tables (admins, settings, products, stocks, orders, wallets, bot_tokens, users)
 * and seeds default records without manual schema migration!
 */
export async function autoCreateSupabaseTables() {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Supabase credentials (SUPABASE_URL & SUPABASE_ANON_KEY/SERVICE_ROLE_KEY) are missing.'
    };
  }

  let sqlContent = '';
  try {
    const schemaPath = path.join(process.cwd(), 'supabase_schema.sql');
    if (fs.existsSync(schemaPath)) {
      sqlContent = fs.readFileSync(schemaPath, 'utf8');
    }
  } catch (e) {
    console.warn('[Supabase AutoCreate] Reading schema file note:', e.message);
  }

  // Attempt direct SQL execution if possible
  if (sqlContent) {
    const sqlExecRes = await executeSupabaseSql(sqlContent);
    if (sqlExecRes.success) {
      return {
        success: true,
        method: sqlExecRes.method,
        message: 'Tabel Supabase dan data awal berhasil dibuat otomatis melalui skema SQL!'
      };
    }
  }

  // Fallback: Verify and initialize via Supabase JS client
  try {
    const tables = ['admins', 'settings', 'products', 'stocks', 'orders', 'wallets', 'bot_tokens', 'users', 'payment_methods', 'channels', 'credentials', 'transactions', 'coupons', 'system_logs'];
    const tableStatus = {};

    for (const t of tables) {
      if (t === 'wallets') {
        const { error: wErr } = await client.from('crypto_wallets').select('*').limit(1);
        const { error: wErr2 } = await client.from('wallets').select('*').limit(1);
        const ok1 = !wErr || (!wErr.message?.includes('does not exist') && wErr.code !== '42P01');
        const ok2 = !wErr2 || (!wErr2.message?.includes('does not exist') && wErr2.code !== '42P01');
        tableStatus[t] = ok1 || ok2;
      } else {
        const { error } = await client.from(t).select('*').limit(1);
        tableStatus[t] = !error || (!error.message?.includes('does not exist') && error.code !== '42P01');
      }
    }

    const allReady = Object.values(tableStatus).every(Boolean);

    return {
      success: allReady,
      tables: tableStatus,
      message: allReady 
        ? 'Semua tabel di Supabase sudah siap dan aktif!' 
        : 'Sebagian tabel belum terdeteksi. Gunakan SUPABASE_DB_URL atau jalankan supabase_schema.sql di SQL Editor.'
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      message: `Error inisialisasi tabel Supabase: ${err.message}`
    };
  }
}

export async function testSupabaseConnection() {
  const client = getSupabase();
  if (!client) {
    return {
      connected: false,
      configured: false,
      message: 'SUPABASE_URL and SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are not set in environment variables.'
    };
  }

  try {
    // Try to query settings table
    const { data, error } = await client.from('settings').select('*').limit(1);
    if (error) {
      // Table might not exist yet, but connection is alive!
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          connected: true,
          configured: true,
          tablesReady: false,
          message: 'Terhubung ke Supabase! Tabel belum dibuat. Klik tombol "Otomatis Buat Tabel" untuk membuat tabel langsung.'
        };
      }
      return {
        connected: false,
        configured: true,
        error: error.message,
        message: `Gagal query Supabase: ${error.message}`
      };
    }

    return {
      connected: true,
      configured: true,
      tablesReady: true,
      message: 'Koneksi ke Supabase berhasil & semua tabel aktif!',
      sampleData: data
    };
  } catch (err) {
    return {
      connected: false,
      configured: true,
      error: err.message,
      message: `Error koneksi Supabase: ${err.message}`
    };
  }
}

export default {
  getSupabase,
  isSupabaseEnabled,
  executeSupabaseSql,
  autoCreateSupabaseTables,
  testSupabaseConnection
};
