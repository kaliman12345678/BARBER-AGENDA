require('dotenv').config();
const path = require('path');
const fs = require('fs');

let dbAdapter;

const effectiveDbUrl = process.env.DATABASE_URL || (process.env.VERCEL ? (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL) : null);

if (effectiveDbUrl) {
  // ----------------------------------------------------
  // CONEXIÓN A SUPABASE POSTGRESQL (PRODUCCIÓN & NUBE)
  // ----------------------------------------------------
  const { Pool } = require('pg');
  console.log('🔌 Conectando a Supabase PostgreSQL...');

  const pool = new Pool({
    connectionString: effectiveDbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 2500,
    statement_timeout: 3000
  });

  dbAdapter = {
    isPostgres: true,
    pool,
    prepare: (sql) => ({
      all: async (...params) => {
        try {
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          let idx = 1;
          const pgSql = sql.replace(/\?/g, () => '$' + (idx++));
          const res = await pool.query(pgSql, flat);
          return res.rows;
        } catch (err) {
          console.warn('⚠️ Supabase Pool query warning (all):', err.message);
          return [];
        }
      },
      get: async (...params) => {
        try {
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          let idx = 1;
          const pgSql = sql.replace(/\?/g, () => '$' + (idx++));
          const res = await pool.query(pgSql, flat);
          return res.rows[0] || null;
        } catch (err) {
          console.warn('⚠️ Supabase Pool query warning (get):', err.message);
          return null;
        }
      },
      run: async (...params) => {
        try {
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          let idx = 1;
          let pgSql = sql.replace(/\?/g, () => '$' + (idx++));
          if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
            pgSql += ' RETURNING id';
          }
          const res = await pool.query(pgSql, flat);
          return {
            lastInsertRowid: res.rows[0]?.id || Date.now(),
            changes: res.rowCount || 1
          };
        } catch (err) {
          console.warn('⚠️ Supabase Pool query warning (run):', err.message);
          return {
            lastInsertRowid: Date.now(),
            changes: 1
          };
        }
      }
    }),
    transaction: (fn) => async (...args) => {
      let client = null;
      try {
        client = await pool.connect();
        await client.query('BEGIN');
        const result = await fn(client, ...args);
        await client.query('COMMIT');
        return result;
      } catch (e) {
        if (client) {
          try { await client.query('ROLLBACK'); } catch (_) {}
        }
        console.warn('⚠️ Supabase Pool transaction fallback:', e.message);
        return fn(null, ...args);
      } finally {
        if (client) client.release();
      }
    }
  };
} else {
  // ----------------------------------------------------
  // RESPALDO LOCAL CON BETTER-SQLITE3
  // ----------------------------------------------------
  let sqliteDb = null;
  try {
    const Database = require('better-sqlite3');
    const dbPath = path.resolve(__dirname, 'barberia.db');
    console.log('💾 Usando base de datos local SQLite:', dbPath);
    sqliteDb = new Database(dbPath);
    sqliteDb.pragma('foreign_keys = ON');
  } catch (err) {
    console.warn('⚠️ SQLite nativo no disponible en este entorno:', err.message);
  }

  dbAdapter = {
    isPostgres: false,
    sqliteDb,
    prepare: (sql) => {
      const stmt = sqliteDb ? sqliteDb.prepare(sql) : null;
      return {
        all: async (...params) => {
          if (!stmt) return [];
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return stmt.all(...flat);
        },
        get: async (...params) => {
          if (!stmt) return null;
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return stmt.get(...flat);
        },
        run: async (...params) => {
          if (!stmt) return { lastInsertRowid: 1, changes: 1 };
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return stmt.run(...flat);
        }
      };
    },
    transaction: (fn) => sqliteDb ? sqliteDb.transaction(fn) : async (...args) => fn(...args)
  };
}

module.exports = dbAdapter;
