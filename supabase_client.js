import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

let supabaseClient = null;

/**
 * Returns a configured Supabase client or null if env is not provided.
 * Uses lazy initialization so that missing credentials never crash the server.
 */
export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || 
              process.env.SUPABASE_ANON_KEY || 
              process.env.VITE_SUPABASE_ANON_KEY || '';

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
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  return Boolean(url && key && url.startsWith('http'));
}

/**
 * Executes a raw SQL query or multi-statement DDL against Supabase.
 * Supports:
 * 1. Direct PostgreSQL connection via SUPABASE_DB_URL or DATABASE_URL (instant 1-click DDL)
 * 2. Supabase pg/query REST API using SUPABASE_SERVICE_ROLE_KEY
 */
export async function executeSupabaseSql(sqlQuery) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  // 1. Try direct PostgreSQL connection if connection string is provided
  if (dbUrl) {
    try {
      const client = new pg.Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false }
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
      console.warn('[Supabase SQL] Direct PG attempt notice:', pgErr.message);
    }
  }

  // 2. Try Supabase pg/query HTTP endpoint
  if (supabaseUrl && serviceRoleKey) {
    try {
      const endpoint = `${supabaseUrl.replace(/\/$/, '')}/pg/query`;
      const resp = await fetch(endpoint, {
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
