const db = require('./database');
const dbConfig = require('../../config/database');

const isPostgres = dbConfig.mode === 'postgres';

function withReturningId(sql) {
  return isPostgres ? `${sql} RETURNING id` : sql;
}

async function createShift(shift) {
  const sql = withReturningId(
    `INSERT INTO shifts (posted_by, shift_date, start_time, end_time, role_name, location, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const params = [
    shift.posted_by,
    shift.shift_date,
    shift.start_time,
    shift.end_time,
    shift.role_name,
    shift.location || null,
    shift.status || 'open',
  ];

  const result = await db.query(sql, params);
  return result.insertId || (result.rows[0] && result.rows[0].id) || null;
}

async function getShiftById(id) {
  const sql = `SELECT s.*, u.name AS posted_by_name
               FROM shifts s
               JOIN users u ON u.id = s.posted_by
               WHERE s.id = ?`;
  const result = await db.query(sql, [id]);
  return result.rows[0] || null;
}

async function listShifts(filters = {}) {
  const clauses = [];
  const params = [];

  if (filters.status) {
    clauses.push('s.status = ?');
    params.push(filters.status);
  }

  if (filters.posted_by) {
    clauses.push('s.posted_by = ?');
    params.push(filters.posted_by);
  }

  if (filters.shift_date) {
    clauses.push('s.shift_date = ?');
    params.push(filters.shift_date);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `SELECT s.*, u.name AS posted_by_name
               FROM shifts s
               JOIN users u ON u.id = s.posted_by
               ${whereClause}
               ORDER BY s.shift_date ASC, s.start_time ASC`;

  const result = await db.query(sql, params);
  return result.rows;
}

async function updateShift(id, updates) {
  const allowed = ['shift_date', 'start_time', 'end_time', 'role_name', 'location', 'status'];
  const keys = Object.keys(updates).filter((key) => allowed.includes(key));
  if (!keys.length) {
    return 0;
  }

  const assignments = keys.map((key) => `${key} = ?`);
  const params = keys.map((key) => updates[key]);
  assignments.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  const sql = `UPDATE shifts SET ${assignments.join(', ')} WHERE id = ?`;
  const result = await db.query(sql, params);
  return result.rowCount;
}

async function deleteShift(id) {
  const result = await db.query('DELETE FROM shifts WHERE id = ?', [id]);
  return result.rowCount;
}

module.exports = {
  createShift,
  getShiftById,
  listShifts,
  updateShift,
  deleteShift,
};
