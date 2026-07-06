const claimModel = require('../models/claim');
const shiftModel = require('../models/shift');
const database = require('../models/database');
const dbConfig = require('../../config/database');
const {
  ServiceError,
  assertNonEmptyString,
  copyRecord
} = require('./serviceUtils');
const { checkOvertimeRisk } = require('./overtimeService');

const isPostgres = dbConfig.mode === 'postgres';

function withReturningId(sql) {
  return isPostgres ? `${sql} RETURNING id` : sql;
}

function shiftDurationHours(shift) {
  const start = Number(shift.startTime.split(':')[0]) + Number(shift.startTime.split(':')[1]) / 60;
  const end = Number(shift.endTime.split(':')[0]) + Number(shift.endTime.split(':')[1]) / 60;
  let duration = end - start;
  if (duration <= 0) {
    duration += 24;
  }
  return duration;
}

/**
 * Approves a pending shift claim.
 * @param {string} claimId Claim id.
 * @param {string} managerId Manager id.
 * @param {string} [notes=''] Decision notes.
 * @returns {Promise<object>} Approval record.
 */
async function approveClaim(claimId, managerId, notes = '') {
  assertNonEmptyString(claimId, 'claimId');
  assertNonEmptyString(managerId, 'managerId');
  if (notes !== undefined && typeof notes !== 'string') {
    throw new ServiceError('notes must be a string');
  }

  const claim = await claimModel.getClaimById(claimId);
  if (!claim) {
    throw new ServiceError('Claim not found', 404);
  }
  if (claim.status !== 'pending') {
    throw new ServiceError('Only pending claims can be approved', 409);
  }

  const shift = await shiftModel.getShiftById(claim.shift_id);
  if (!shift) {
    throw new ServiceError('Shift not found for this claim', 404);
  }

  const additionalHours = shiftDurationHours(mapShift(shift));
  const overtimeRisk = await checkOvertimeRisk(String(claim.claimed_by), additionalHours);

  const approvalId = await database.transaction(async (tx) => {
    await tx.query(
      'UPDATE claims SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['approved', claimId]
    );
    await tx.query(
      'UPDATE shifts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['approved', claim.shift_id]
    );
    const insertSql = withReturningId(
      `INSERT INTO approvals (claim_id, manager_id, decision, decision_date, notes)
       VALUES (?, ?, ?, ?, ?)`
    );
    const result = await tx.query(insertSql, [claimId, managerId.trim(), 'approved', new Date().toISOString(), notes.trim()]);
    return result.insertId || (result.rows[0] && result.rows[0].id);
  });

  const approval = await getApprovalById(approvalId);

  const { logAction } = require('./auditService');
  const { sendNotification } = require('./notificationService');
  await logAction(managerId, 'claim_approved', 'approval', approval.id, {
    claimId: String(claim.id),
    shiftId: String(claim.shift_id),
    overtimeRisk
  });

  await sendNotification(String(claim.claimed_by), 'sms', `Your claim ${claim.id} was approved.`);
  await sendNotification(String(shift.posted_by), 'sms', `Your shift ${shift.id} claim was approved.`);

  return copyRecord(approval);
}

/**
 * Rejects a pending shift claim.
 * @param {string} claimId Claim id.
 * @param {string} managerId Manager id.
 * @param {string} [notes=''] Decision notes.
 * @returns {Promise<object>} Rejection record.
 */
async function rejectClaim(claimId, managerId, notes = '') {
  assertNonEmptyString(claimId, 'claimId');
  assertNonEmptyString(managerId, 'managerId');
  if (notes !== undefined && typeof notes !== 'string') {
    throw new ServiceError('notes must be a string');
  }

  const claim = await claimModel.getClaimById(claimId);
  if (!claim) {
    throw new ServiceError('Claim not found', 404);
  }
  if (claim.status !== 'pending') {
    throw new ServiceError('Only pending claims can be rejected', 409);
  }

  const shift = await shiftModel.getShiftById(claim.shift_id);
  if (!shift) {
    throw new ServiceError('Shift not found for this claim', 404);
  }

  const approvalId = await database.transaction(async (tx) => {
    await tx.query(
      'UPDATE claims SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['rejected', claimId]
    );
    await tx.query(
      'UPDATE shifts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['open', claim.shift_id]
    );
    const insertSql = withReturningId(
      `INSERT INTO approvals (claim_id, manager_id, decision, decision_date, notes)
       VALUES (?, ?, ?, ?, ?)`
    );
    const result = await tx.query(insertSql, [claimId, managerId.trim(), 'rejected', new Date().toISOString(), notes.trim()]);
    return result.insertId || (result.rows[0] && result.rows[0].id);
  });

  const approval = await getApprovalById(approvalId);

  const { logAction } = require('./auditService');
  const { sendNotification } = require('./notificationService');
  await logAction(managerId, 'claim_rejected', 'approval', approval.id, {
    claimId: String(claim.id),
    shiftId: String(claim.shift_id)
  });

  await sendNotification(String(claim.claimed_by), 'sms', `Your claim ${claim.id} was rejected.`);
  await sendNotification(String(shift.posted_by), 'sms', `A claim for your shift ${shift.id} was rejected.`);

  return copyRecord(approval);
}

/**
 * Returns pending claim approvals for a manager queue.
 * @param {string} managerId Manager id.
 * @returns {Promise<object[]>} Pending approvals.
 */
async function getPendingApprovals(managerId) {
  assertNonEmptyString(managerId, 'managerId');

  const pendingClaims = await claimModel.listClaims({ status: 'pending' });
  const result = await Promise.all(pendingClaims.map(async (claim) => {
    const shift = await shiftModel.getShiftById(claim.shift_id);
    return copyRecord({
      claim: mapClaim(claim),
      shift: shift ? mapShift(shift) : null
    });
  }));

  return result;
}

async function getApprovalById(approvalId) {
  const result = await database.query('SELECT * FROM approvals WHERE id = ?', [approvalId]);
  return mapApproval(result.rows[0]);
}

function mapShift(shift) {
  return {
    id: String(shift.id),
    postedBy: String(shift.posted_by),
    shiftDate: shift.shift_date,
    startTime: shift.start_time,
    endTime: shift.end_time,
    roleName: shift.role_name,
    location: shift.location,
    status: shift.status,
    createdAt: shift.created_at,
    updatedAt: shift.updated_at
  };
}

function mapClaim(claim) {
  return {
    id: String(claim.id),
    shiftId: String(claim.shift_id),
    claimedBy: String(claim.claimed_by),
    status: claim.status,
    claimDate: claim.claim_date,
    createdAt: claim.created_at,
    updatedAt: claim.updated_at
  };
}

function mapApproval(approval) {
  if (!approval) {
    return null;
  }

  return {
    id: String(approval.id),
    claimId: String(approval.claim_id),
    managerId: String(approval.manager_id),
    decision: approval.decision,
    decisionDate: approval.decision_date,
    notes: approval.notes || '',
    createdAt: approval.created_at
  };
}

module.exports = {
  approveClaim,
  rejectClaim,
  getPendingApprovals
};
