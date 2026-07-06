const shiftModel = require('../models/shift');
const claimModel = require('../models/claim');
const {
  ServiceError,
  assertNonEmptyString,
  assertObject,
  copyRecord
} = require('./serviceUtils');

function validateShiftData(shiftData) {
  assertObject(shiftData, 'shiftData');
  assertNonEmptyString(shiftData.shiftDate, 'shiftData.shiftDate');
  assertNonEmptyString(shiftData.startTime, 'shiftData.startTime');
  assertNonEmptyString(shiftData.endTime, 'shiftData.endTime');
  assertNonEmptyString(shiftData.roleName, 'shiftData.roleName');
  if (shiftData.location !== undefined && typeof shiftData.location !== 'string') {
    throw new ServiceError('shiftData.location must be a string when provided');
  }
}

/**
 * Creates an open shift posted by an employee.
 * @param {string} userId Posting employee id.
 * @param {object} shiftData Shift payload.
 * @returns {Promise<object>} Created shift record.
 */
async function postShift(userId, shiftData) {
  assertNonEmptyString(userId, 'userId');
  validateShiftData(shiftData);

  const payload = {
    posted_by: userId.trim(),
    shift_date: shiftData.shiftDate.trim(),
    start_time: shiftData.startTime.trim(),
    end_time: shiftData.endTime.trim(),
    role_name: shiftData.roleName.trim(),
    location: shiftData.location ? shiftData.location.trim() : null,
    status: 'open'
  };

  const shiftId = await shiftModel.createShift(payload);
  const createdShift = await shiftModel.getShiftById(shiftId);
  const shift = mapShift(createdShift);

  const { logAction } = require('./auditService');
  await logAction(userId, 'shift_posted', 'shift', shift.id, {
    shiftDate: shift.shiftDate,
    startTime: shift.startTime,
    endTime: shift.endTime,
    roleName: shift.roleName,
    location: shift.location
  });

  return copyRecord(shift);
}

/**
 * Returns shifts filtered by status and common fields.
 * @param {object} [filters={}] Optional filters.
 * @returns {Promise<object[]>} Matching shifts.
 */
async function getShifts(filters = {}) {
  assertObject(filters, 'filters');

  const statusFilter = filters.status
    ? Array.isArray(filters.status)
      ? filters.status
      : [filters.status]
    : null;

  const modelFilters = {};
  if (filters.postedBy) {
    modelFilters.posted_by = filters.postedBy;
  }
  if (filters.shiftDate) {
    modelFilters.shift_date = filters.shiftDate;
  }
  if (statusFilter && statusFilter.length === 1) {
    modelFilters.status = statusFilter[0];
  }

  const rawShifts = await shiftModel.listShifts(modelFilters);
  const shifts = rawShifts
    .map(mapShift)
    .filter((shift) => !statusFilter || statusFilter.includes(shift.status));

  shifts.sort((a, b) => new Date(a.shiftDate) - new Date(b.shiftDate));
  return shifts.map(copyRecord);
}

/**
 * Cancels an open shift if no claim has been made.
 * @param {string} shiftId Shift id.
 * @param {string} userId Acting user id.
 * @returns {Promise<object>} Updated shift.
 */
async function cancelShift(shiftId, userId) {
  assertNonEmptyString(shiftId, 'shiftId');
  assertNonEmptyString(userId, 'userId');

  const shiftRecord = await shiftModel.getShiftById(shiftId);
  const shift = shiftRecord ? mapShift(shiftRecord) : null;
  if (!shift) {
    throw new ServiceError('Shift not found', 404);
  }
  if (shift.postedBy !== userId) {
    throw new ServiceError('Only the posting employee can cancel this shift', 403);
  }
  if (shift.status === 'cancelled') {
    throw new ServiceError('Shift is already cancelled');
  }

  const claimHistory = await claimModel.listClaims({ shift_id: shiftId });
  const hasClaimHistory = claimHistory.length > 0;
  if (hasClaimHistory) {
    throw new ServiceError('Shift cannot be cancelled after a claim has been made', 409);
  }

  await shiftModel.updateShift(shiftId, { status: 'cancelled' });
  const updatedShift = await shiftModel.getShiftById(shiftId);
  const cancelledShift = mapShift(updatedShift);

  const { logAction } = require('./auditService');
  await logAction(userId, 'shift_cancelled', 'shift', cancelledShift.id, {
    previousStatus: 'open',
    newStatus: cancelledShift.status
  });

  return copyRecord(cancelledShift);
}

/**
 * Returns a single shift by id.
 * @param {string} shiftId Shift id.
 * @returns {Promise<object|null>} Shift record or null.
 */
async function getShiftById(shiftId) {
  assertNonEmptyString(shiftId, 'shiftId');
  const shift = await shiftModel.getShiftById(shiftId);
  return shift ? copyRecord(mapShift(shift)) : null;
}

function mapShift(shift) {
  if (!shift) {
    return null;
  }

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

module.exports = {
  postShift,
  getShifts,
  cancelShift,
  getShiftById
};
