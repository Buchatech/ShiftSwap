// Deprecated: service layer has been migrated to database-backed models.
// This module remains for legacy utilities that still reference in-memory collections.
const db = {
  shifts: new Map(),
  claims: new Map(),
  approvals: new Map(),
  notifications: new Map(),
  auditLogs: new Map(),
  counters: {
    shift: 1,
    claim: 1,
    approval: 1,
    notification: 1,
    audit: 1
  }
};

module.exports = db;
