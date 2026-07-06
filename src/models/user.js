const db = require('./database');
const dbConfig = require('../../config/database');

const isPostgres = dbConfig.mode === 'postgres';

function buildInsertReturning(sql) {
  return isPostgres ? `${sql} RETURNING id` : sql;
}

async function createUser(user) {
  const sql = buildInsertReturning(
    `INSERT INTO users (employee_id, name, email, phone, role)
     VALUES (?, ?, ?, ?, ?)`
  );
  const params = [
    user.employee_id,
    user.name,
    user.email || null,
    user.phone || null,
    user.role || 'employee',
  ];

  const result = await db.query(sql, params);
  return result.insertId || (result.rows[0] && result.rows[0].id) || null;
}

async function getUserById(id) {
  const result = await db.query('SELECT * FROM users WHERE id = ?', [id]);
  return result.rows[0] || null;
}

async function getUserByEmployeeId(employeeId) {
  const result = await db.query('SELECT * FROM users WHERE employee_id = ?', [employeeId]);
  return result.rows[0] || null;
}

async function listUsers(filters = {}) {
  const clauses = [];
  const params = [];

  if (filters.role) {
    clauses.push('role = ?');
    params.push(filters.role);
  }

  if (filters.search) {
    clauses.push('(name LIKE ? OR employee_id LIKE ? OR email LIKE ?)');
    const pattern = `%${filters.search}%`;
    params.push(pattern, pattern, pattern);
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `SELECT * FROM users ${whereClause} ORDER BY created_at DESC`;
  const result = await db.query(sql, params);
  return result.rows;
}

async function updateUser(id, updates) {
  const allowed = ['name', 'email', 'phone', 'role'];
  const keys = Object.keys(updates).filter((key) => allowed.includes(key));
  if (!keys.length) {
    return 0;
  }

  const assignments = keys.map((key) => `${key} = ?`);
  const params = keys.map((key) => updates[key]);
  assignments.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);

  const sql = `UPDATE users SET ${assignments.join(', ')} WHERE id = ?`;
  const result = await db.query(sql, params);
  return result.rowCount;
}

async function deleteUser(id) {
  const result = await db.query('DELETE FROM users WHERE id = ?', [id]);
  return result.rowCount;
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmployeeId,
  listUsers,
  updateUser,
  deleteUser,
};
