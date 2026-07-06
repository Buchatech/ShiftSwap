const db = require('./database');
const dbConfig = require('../../config/database');

const isPostgres = dbConfig.mode === 'postgres';

function withReturningId(sql) {
  return isPostgres ? `${sql} RETURNING id` : sql;
}

async function createClaim(claim) {
  const sql = withReturningId(
    `INSERT INTO claims (shift_id, claimed_by, claim_date, status)
     VALUES (?, ?, ?, ?)`
  );
  const params = [
    claim.shift_id,
    claim.claimed_by,
    claim.claim_date || new Date().toISOString(),
    claim.status || 'pending',
  ];

  const result = await db.query(sql, params);
  return result.insertId || (result.rows[0] && result.rows[0].id) || null;
}

async function getClaimById(id) {
  const sql = `SELECT c.*, s.shift_date, s.start_time, s.end_time, s.role_name,
                      claimant.name AS claimed_by_name, poster.name AS posted_by_name
               FROM claims c
               JOIN shifts s ON s.id = c.shift_id
               JOIN users claimant ON claimant.id = c.claimed_by
               JOIN users poster ON poster.id = s.posted_by
               WHERE c.id = ?`;
  const result = await db.query(sql, [id]);
  return result.rows[0] || null;
}

async function listClaims(filters = {}) {
  const clauses = [];
  const params = [];

  if (filters.shift_id) {
    clauses.push('c.shift_id = ?');
    params.push(filters.shift_id);
  }

  if (filters.claimed_by) {
    clauses.push('c.claimed_by = ?');
    params.push(filters.claimed_by);
  }

  if (filters.status) {
    clauses.push('c.status = ?');
    params.push(filters.status);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `SELECT c.*, s.shift_date, s.start_time, s.end_time, s.role_name, u.name AS claimed_by_name
               FROM claims c
               JOIN shifts s ON s.id = c.shift_id
               JOIN users u ON u.id = c.claimed_by
               ${whereClause}
               ORDER BY c.created_at DESC`;
  const result = await db.query(sql, params);
  return result.rows;
}

async function updateClaimStatus(id, status) {
  const sql = `UPDATE claims
               SET status = ?, updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`;
  const result = await db.query(sql, [status, id]);
  return result.rowCount;
}

async function deleteClaim(id) {
  const result = await db.query('DELETE FROM claims WHERE id = ?', [id]);
  return result.rowCount;
}

module.exports = {
  createClaim,
  getClaimById,
  listClaims,
  updateClaimStatus,
  deleteClaim,
};
