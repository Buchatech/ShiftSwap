const database = require('../models/database');
const dbConfig = require('../../config/database');
const {
  assertNonEmptyString,
  copyRecord
} = require('./serviceUtils');

const isPostgres = dbConfig.mode === 'postgres';

/**
 * Queues a notification. MVP behavior logs to console.
 * @param {string} userId Recipient user id.
 * @param {string} type Notification type (sms, email, push, etc.).
 * @param {string} message Notification message body.
 * @returns {Promise<object>} Created notification record.
 */
async function sendNotification(userId, type, message) {
  assertNonEmptyString(userId, 'userId');
  assertNonEmptyString(type, 'type');
  assertNonEmptyString(message, 'message');

  const insertSql = isPostgres
    ? `INSERT INTO notifications (user_id, type, message, status, sent_at)
       VALUES (?, ?, ?, ?, ?)
       RETURNING *`
    : `INSERT INTO notifications (user_id, type, message, status, sent_at)
       VALUES (?, ?, ?, ?, ?)`;
  const params = [userId.trim(), type.trim(), message.trim(), 'queued', null];
  const result = await database.query(insertSql, params);

  let notificationRow = result.rows[0];
  if (!notificationRow) {
    const inserted = await database.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
    notificationRow = inserted.rows[0];
  }
  const notification = {
    id: String(notificationRow.id),
    userId: String(notificationRow.user_id),
    type: notificationRow.type,
    message: notificationRow.message,
    status: notificationRow.status,
    createdAt: notificationRow.created_at
  };

  console.log(`[Notification:${notification.type}] to ${notification.userId}: ${notification.message}`);

  const { logAction } = require('./auditService');
  await logAction(notification.userId, 'notification_queued', 'notification', notification.id, {
    channel: notification.type,
    status: notification.status
  });

  return copyRecord(notification);
}

module.exports = {
  sendNotification
};
