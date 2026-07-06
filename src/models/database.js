const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const { Pool } = require('pg');
const mysql = require('mysql2/promise');
const dbConfig = require('../../config/database');

// DatabaseManager abstracts backend-specific drivers behind one query API.
// Models use a single SQL placeholder style ("?") and receive normalized results.
class DatabaseManager {
  constructor() {
    this.mode = dbConfig.mode;
    this.connected = false;
    this.pool = null;
    this.sqliteDb = null;
    this.sqliteWritePending = false;
  }

  async init() {
    if (this.connected) {
      return this;
    }

    await this.withRetry(async () => {
      if (this.mode === 'postgres') {
        await this.initPostgres();
      } else if (this.mode === 'mysql') {
        await this.initMysql();
      } else {
        await this.initSqlite();
      }
    });

    this.connected = true;
    return this;
  }

  async initPostgres() {
    const config = dbConfig.postgres;
    this.pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
      max: config.pool.max,
      min: config.pool.min,
      idleTimeoutMillis: config.pool.idleTimeoutMillis,
      connectionTimeoutMillis: config.pool.connectionTimeoutMillis,
    });
    await this.pool.query('SELECT 1');
  }

  async initMysql() {
    const config = dbConfig.mysql;
    this.pool = mysql.createPool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      connectionLimit: config.pool.connectionLimit,
      waitForConnections: config.pool.waitForConnections,
      queueLimit: config.pool.queueLimit,
      connectTimeout: config.pool.connectTimeout,
      timezone: config.timezone,
      decimalNumbers: true,
      multipleStatements: true,
    });
    await this.pool.query('SELECT 1');
  }

  async initSqlite() {
    const SQL = await initSqlJs();
    const filename = dbConfig.sqlite.filename;
    const dirName = path.dirname(filename);

    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }

    if (fs.existsSync(filename)) {
      const fileBuffer = fs.readFileSync(filename);
      this.sqliteDb = new SQL.Database(fileBuffer);
    } else {
      this.sqliteDb = new SQL.Database();
      this.persistSqlite();
    }

    this.sqliteDb.run('PRAGMA foreign_keys = ON;');
  }

  async query(sql, params = []) {
    if (!this.connected) {
      await this.init();
    }

    try {
      // Application code always sends SQL with "?" placeholders.
      // This layer rewrites placeholders for PostgreSQL and normalizes results
      // so models can stay database-agnostic.
      if (this.mode === 'postgres') {
        return await this.queryPostgres(sql, params);
      }
      if (this.mode === 'mysql') {
        return await this.queryMysql(sql, params);
      }
      return this.querySqlite(sql, params);
    } catch (error) {
      const dbError = new Error(`Database query failed (${this.mode}): ${error.message}`);
      dbError.originalError = error;
      dbError.sql = sql;
      throw dbError;
    }
  }

  async transaction(callback) {
    if (!this.connected) {
      await this.init();
    }

    if (this.mode === 'postgres') {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const tx = {
          query: async (sql, params = []) => {
            const pgSql = this.toPostgresPlaceholders(sql);
            const result = await client.query(pgSql, params);
            return {
              rows: result.rows || [],
              rowCount: Number(result.rowCount || 0),
              insertId: result.rows && result.rows[0] && result.rows[0].id ? result.rows[0].id : null,
            };
          },
        };
        const value = await callback(tx);
        await client.query('COMMIT');
        return value;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    }

    if (this.mode === 'mysql') {
      const connection = await this.pool.getConnection();
      try {
        await connection.beginTransaction();
        const tx = {
          query: async (sql, params = []) => {
            const [result] = await connection.execute(sql, params);
            return this.normalizeMysqlResult(result);
          },
        };
        const value = await callback(tx);
        await connection.commit();
        return value;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    try {
      this.sqliteDb.run('BEGIN');
      const tx = { query: (sql, params = []) => this.querySqlite(sql, params) };
      const value = await callback(tx);
      this.sqliteDb.run('COMMIT');
      this.persistSqlite();
      return value;
    } catch (error) {
      this.sqliteDb.run('ROLLBACK');
      throw error;
    }
  }

  async close() {
    if (!this.connected) {
      return;
    }

    if (this.mode === 'postgres' && this.pool) {
      await this.pool.end();
    } else if (this.mode === 'mysql' && this.pool) {
      await this.pool.end();
    } else if (this.mode === 'sqlite' && this.sqliteDb) {
      this.persistSqlite();
      this.sqliteDb.close();
      this.sqliteDb = null;
    }

    this.pool = null;
    this.connected = false;
  }

  async withRetry(fn) {
    const maxRetries = dbConfig.retry.maxRetries;
    let attempt = 0;
    let delay = dbConfig.retry.initialDelayMs;

    while (true) {
      try {
        return await fn();
      } catch (error) {
        if (attempt >= maxRetries) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt += 1;
        delay = Math.min(delay * 2, dbConfig.retry.maxDelayMs);
      }
    }
  }

  async queryPostgres(sql, params) {
    const pgSql = this.toPostgresPlaceholders(sql);
    const result = await this.pool.query(pgSql, params);
    return {
      rows: result.rows || [],
      rowCount: Number(result.rowCount || 0),
      insertId: result.rows && result.rows[0] && result.rows[0].id ? result.rows[0].id : null,
    };
  }

  async queryMysql(sql, params) {
    const [result] = await this.pool.execute(sql, params);
    return this.normalizeMysqlResult(result);
  }

  querySqlite(sql, params) {
    const trimmed = sql.trim();
    const isSelect = /^select/i.test(trimmed);
    const isWrite = /^(insert|update|delete|replace|create|drop|alter|pragma)/i.test(trimmed);

    if (isSelect) {
      const statement = this.sqliteDb.prepare(sql);
      statement.bind(params);
      const rows = [];
      while (statement.step()) {
        rows.push(statement.getAsObject());
      }
      statement.free();
      return { rows, rowCount: rows.length, insertId: null };
    }

    this.sqliteDb.run(sql, params);
    const idResult = this.sqliteDb.exec('SELECT last_insert_rowid() AS id;');
    const insertId = idResult[0] && idResult[0].values[0] ? idResult[0].values[0][0] : null;

    if (isWrite) {
      this.persistSqlite();
    }

    return { rows: [], rowCount: this.sqliteDb.getRowsModified(), insertId };
  }

  normalizeMysqlResult(result) {
    if (Array.isArray(result)) {
      return { rows: result, rowCount: result.length, insertId: null };
    }

    return {
      rows: [],
      rowCount: Number(result.affectedRows || 0),
      insertId: result.insertId || null,
    };
  }

  toPostgresPlaceholders(sql) {
    let index = 0;
    return sql.replace(/\?/g, () => {
      index += 1;
      return `$${index}`;
    });
  }

  persistSqlite() {
    if (!this.sqliteDb || this.sqliteWritePending) {
      return;
    }

    this.sqliteWritePending = true;
    try {
      const data = this.sqliteDb.export();
      fs.writeFileSync(dbConfig.sqlite.filename, Buffer.from(data));
    } finally {
      this.sqliteWritePending = false;
    }
  }
}

const database = new DatabaseManager();

module.exports = database;
