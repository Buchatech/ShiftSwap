const claimModel = require('../models/claim');
const shiftModel = require('../models/shift');
const database = require('../models/database');
const dbConfig = require('../../config/database');
const {
  ServiceError,
  assertNonEmptyString,
  copyRecord
} = require('./serviceUtils');

const isPostgres = dbConfig.mode === 'postgres';

function withReturningId(sql) {
  return isPostgres ? `${sql} RETURNING id` : sql;
}

/**
 * Creates a pending claim against an open shift.
 * @param {string} shiftId Shift id.
 * @param {string} userId Claiming employee id.
 * @returns {Promise<object>} Created claim.
 */
async function claimShift(shiftId, userId) {
  assertNonEmptyString(shiftId, 'shiftId');
  assertNonEmptyString(userId, 'userId');

  const shift = await shiftModel.getShiftById(shiftId);
  if (!shift) {
    throw new ServiceError('Shift not found', 404);
  }
  if (shift.status !== 'open') {
    throw new ServiceError('Only open shifts can be claimed', 409);
  }
  if (String(shift.posted_by) === userId.trim()) {
    throw new ServiceError('Employees cannot claim their own shifts', 409);
  }

  const claimId = await database.transaction(async (tx) => {
    const insertSql = withReturningId(
      `INSERT INTO claims (shift_id, claimed_by, claim_date, status)
       VALUES (?, ?, ?, ?)`
    );
    const result = await tx.query(insertSql, [shiftId, userId.trim(), new Date().toISOString(), 'pending']);

    await tx.query('UPDATE shifts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['claimed', shiftId]);
    return result.insertId || (result.rows[0] && result.rows[0].id);
  });

  const claim = await claimModel.getClaimById(claimId);
  const mappedClaim = mapClaim(claim);

  const { logAction } = require('./auditService');
  const { sendNotification } = require('./notificationService');
  await logAction(userId, 'shift_claimed', 'claim', mappedClaim.id, {
    shiftId: mappedClaim.shiftId,
    claimStatus: mappedClaim.status
  });
  await sendNotification(String(shift.posted_by), 'sms', `Your shift ${shift.id} was claimed by user ${userId}.`);

  return copyRecord(mappedClaim);
}

/**
 * Cancels a pending claim before manager approval.
 * @param {string} claimId Claim id.
 * @param {string} userId Acting employee id.
 * @returns {Promise<object>} Updated claim.
 */
async function cancelClaim(claimId, userId) {
  assertNonEmptyString(claimId, 'claimId');
  assertNonEmptyString(userId, 'userId');

  const claimRecord = await claimModel.getClaimById(claimId);
  const claim = claimRecord ? mapClaim(claimRecord) : null;
  if (!claim) {
    throw new ServiceError('Claim not found', 404);
  }
  if (claim.claimedBy !== userId) {
    throw new ServiceError('Employees can only cancel their own claims', 403);
  }
  if (claim.status !== 'pending') {
    throw new ServiceError('Only pending claims can be cancelled by employees', 409);
  }

  await database.transaction(async (tx) => {
    await tx.query(
      'UPDATE claims SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['cancelled', claimId]
    );
    await tx.query(
      'UPDATE shifts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      ['open', claim.shiftId]
    );
  });

  const updatedClaim = await claimModel.getClaimById(claimId);
  const mappedClaim = mapClaim(updatedClaim);
  const shift = await shiftModel.getShiftById(claim.shiftId);

  const { logAction } = require('./auditService');
  const { sendNotification } = require('./notificationService');
  await logAction(userId, 'claim_cancelled', 'claim', mappedClaim.id, {
    shiftId: mappedClaim.shiftId,
    previousStatus: 'pending',
    newStatus: mappedClaim.status
  });

  if (shift) {
    await sendNotification(String(shift.posted_by), 'sms', `Claim ${mappedClaim.id} for shift ${mappedClaim.shiftId} was cancelled.`);
  }

  return copyRecord(mappedClaim);
}

/**
 * Returns a claim by id.
 * @param {string} claimId Claim id.
 * @returns {Promise<object|null>} Claim record or null.
 */
async function getClaimById(claimId) {
  assertNonEmptyString(claimId, 'claimId');
  const claim = await claimModel.getClaimById(claimId);
  return claim ? copyRecord(mapClaim(claim)) : null;
}

/**
 * Returns claims for a user.
 * @param {string} userId User id.
 * @returns {Promise<object[]>} User claim records.
 */
async function getClaimsByUser(userId) {
  assertNonEmptyString(userId, 'userId');
  const claims = await claimModel.listClaims({ claimed_by: userId });
  return claims.map((claim) => copyRecord(mapClaim(claim)));
}

function mapClaim(claim) {
  if (!claim) {
    return null;
  }

  return {
    id: String(claim.id),
    shiftId: String(claim.shift_id),
    claimedBy: String(claim.claimed_by),
    status: claim.status,
    claimDate: claim.claim_date,
    createdAt: claim.created_at,
    updatedAt: claim.updated_at,
    decisionDate: claim.decision_date || null,
    reviewedBy: claim.reviewed_by ? String(claim.reviewed_by) : null,
    reviewNotes: claim.review_notes || null
  };
}

module.exports = {
  claimShift,
  cancelClaim,
  getClaimById,
  getClaimsByUser
};
