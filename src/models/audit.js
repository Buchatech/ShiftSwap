const db = require('./database');
const dbConfig = require('../../config/database');

const isPostgres = dbConfig.mode === 'postgres';

function parseDetails(details) {
  if (details == null) {
    return null;
  }
  if (typeof details === 'object') {
    return details;
  }
  try {
    return JSON.parse(details);
  } catch (error) {
    return details;
  }
}

async function logAuditEvent(entry) {
  const detailsValue = entry.details == null ? null : JSON.stringify(entry.details);
  const detailsExpression = isPostgres ? '?::jsonb' : '?';
  const sql = isPostgres
    ? `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ${detailsExpression}, ?)
       RETURNING *`
    : `INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ${detailsExpression}, ?)`;
  const params = [
    entry.user_id || null,
    entry.action,
    entry.entity_type,
    entry.entity_id,
    detailsValue,
    entry.ip_address || null,
  ];

  const result = await db.query(sql, params);
  if (result.rows[0]) {
    return { ...result.rows[0], details: parseDetails(result.rows[0].details) };
  }

  const insertedId = result.insertId;
  const inserted = await db.query('SELECT * FROM audit_log WHERE id = ?', [insertedId]);
  return { ...inserted.rows[0], details: parseDetails(inserted.rows[0].details) };
}

async function getAuditByEntity(entityType, entityId) {
  const sql = `SELECT * FROM audit_log
               WHERE entity_type = ? AND entity_id = ?
               ORDER BY timestamp DESC`;
  const result = await db.query(sql, [entityType, entityId]);
  return result.rows.map((row) => ({ ...row, details: parseDetails(row.details) }));
}

async function getAuditByUser(userId, options = {}) {
  const limit = Number(options.limit || 100);
  const sql = `SELECT * FROM audit_log
               WHERE user_id = ?
               ORDER BY timestamp DESC
               LIMIT ?`;
  const result = await db.query(sql, [userId, limit]);
  return result.rows.map((row) => ({ ...row, details: parseDetails(row.details) }));
}

async function listAuditEntries(filters = {}) {
  const clauses = [];
  const params = [];

  if (filters.action) {
    clauses.push('action = ?');
    params.push(filters.action);
  }

  if (filters.entity_type) {
    clauses.push('entity_type = ?');
    params.push(filters.entity_type);
  }

  if (filters.user_id) {
    clauses.push('user_id = ?');
    params.push(filters.user_id);
  }

  if (filters.entity_id) {
    clauses.push('entity_id = ?');
    params.push(filters.entity_id);
  }

  if (filters.from_timestamp) {
    clauses.push('timestamp >= ?');
    params.push(filters.from_timestamp);
  }

  if (filters.to_timestamp) {
    clauses.push('timestamp <= ?');
    params.push(filters.to_timestamp);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `SELECT * FROM audit_log
               ${whereClause}
               ORDER BY timestamp DESC`;
  const result = await db.query(sql, params);
  return result.rows.map((row) => ({ ...row, details: parseDetails(row.details) }));
}

module.exports = {
  logAuditEvent,
  getAuditByEntity,
  getAuditByUser,
  listAuditEntries,
};
