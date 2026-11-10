require('dotenv').config();
const path = require('path');
const fs = require('fs');

let dbAdapter;

if (process.env.DATABASE_URL) {
  // ----------------------------------------------------
  // CONEXIÓN A SUPABASE POSTGRESQL (PRODUCCIÓN & NUBE)
  // ----------------------------------------------------
  const { Pool } = require('pg');
  console.log('🔌 Conectando a Supabase PostgreSQL mediante DATABASE_URL...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  dbAdapter = {
    isPostgres: true,
    pool,
    prepare: (sql) => ({
      all: async (...params) => {
        const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        let idx = 1;
        const pgSql = sql.replace(/\?/g, () => '$' + (idx++));
        const res = await pool.query(pgSql, flat);
        return res.rows;
      },
      get: async (...params) => {
        const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        let idx = 1;
        const pgSql = sql.replace(/\?/g, () => '$' + (idx++));
        const res = await pool.query(pgSql, flat);
        return res.rows[0];
      },
      run: async (...params) => {
        const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        let idx = 1;
        let pgSql = sql.replace(/\?/g, () => '$' + (idx++));
        if (pgSql.trim().toUpperCase().startsWith('INSERT') && !pgSql.toUpperCase().includes('RETURNING')) {
          pgSql += ' RETURNING id';
        }
        const res = await pool.query(pgSql, flat);
        return {
          lastInsertRowid: res.rows[0]?.id || 0,
          changes: res.rowCount
        };
      }
    }),
    transaction: (fn) => async (...args) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(client, ...args);
        await client.query('COMMIT');
        return result;
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    }
  };
} else {
  // ----------------------------------------------------
  // RESPALDO LOCAL CON BETTER-SQLITE3
  // ----------------------------------------------------
  const Database = require('better-sqlite3');
  const dbPath = path.resolve(__dirname, 'barberia.db');
  console.log('💾 Usando base de datos local SQLite:', dbPath);

  const sqliteDb = new Database(dbPath);
  sqliteDb.pragma('foreign_keys = ON');

  dbAdapter = {
    isPostgres: false,
    sqliteDb,
    prepare: (sql) => {
      const stmt = sqliteDb.prepare(sql);
      return {
        all: async (...params) => {
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return stmt.all(...flat);
        },
        get: async (...params) => {
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return stmt.get(...flat);
        },
        run: async (...params) => {
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return stmt.run(...flat);
        }
      };
    },
    transaction: (fn) => sqliteDb.transaction(fn)
  };
}

module.exports = dbAdapter;
