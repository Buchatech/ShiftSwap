const auditModel = require('../models/audit');
const {
  assertNonEmptyString,
  assertObject,
  toDate
} = require('./serviceUtils');

/**
 * Writes an immutable audit log entry.
 * @param {string} userId Acting user id.
 * @param {string} action Action label.
 * @param {string} entityType Entity type (shift, claim, approval, etc.).
 * @param {string} entityId Entity identifier.
 * @param {object} [details={}] Additional action details.
 * @returns {Promise<object>} Persisted audit record.
 */
async function logAction(userId, action, entityType, entityId, details = {}) {
  assertNonEmptyString(userId, 'userId');
  assertNonEmptyString(action, 'action');
  assertNonEmptyString(entityType, 'entityType');
  assertNonEmptyString(entityId, 'entityId');
  assertObject(details, 'details');

  const created = await auditModel.logAuditEvent({
    user_id: userId.trim(),
    action: action.trim(),
    entity_type: entityType.trim(),
    entity_id: entityId.trim(),
    details
  });

  return {
    id: String(created.id),
    userId: String(created.user_id),
    action: created.action,
    entityType: created.entity_type,
    entityId: String(created.entity_id),
    details: created.details,
    timestamp: created.timestamp
  };
}

/**
 * Returns audit records with optional field/date filtering.
 * @param {object} [filters={}] Field filters (userId, action, entityType, entityId).
 * @param {object} [dateRange={}] Date range { startDate, endDate }.
 * @returns {Promise<object[]>} Filtered audit records sorted descending by timestamp.
 */
async function getAuditTrail(filters = {}, dateRange = {}) {
  assertObject(filters, 'filters');
  assertObject(dateRange, 'dateRange');

  const startDate = dateRange.startDate ? toDate(dateRange.startDate, 'dateRange.startDate') : null;
  const endDate = dateRange.endDate ? toDate(dateRange.endDate, 'dateRange.endDate') : null;

  const records = await auditModel.listAuditEntries({
    user_id: filters.userId,
    action: filters.action,
    entity_type: filters.entityType,
    entity_id: filters.entityId,
    from_timestamp: startDate ? startDate.toISOString() : undefined,
    to_timestamp: endDate ? endDate.toISOString() : undefined
  });

  return records.map((entry) => ({
    id: String(entry.id),
    userId: entry.user_id == null ? null : String(entry.user_id),
    action: entry.action,
    entityType: entry.entity_type,
    entityId: String(entry.entity_id),
    details: entry.details,
    timestamp: entry.timestamp
  }));
}

module.exports = {
  logAction,
  getAuditTrail
};
