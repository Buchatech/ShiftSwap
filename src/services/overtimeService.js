const claimModel = require('../models/claim');
const shiftModel = require('../models/shift');
const {
  ServiceError,
  assertNonEmptyString,
  assertNumber,
  toDate
} = require('./serviceUtils');

const WEEKLY_HOUR_LIMIT = 40;

function normalizeToStartOfDay(date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function mondayStart(date) {
  const normalized = normalizeToStartOfDay(date);
  const day = normalized.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  normalized.setDate(normalized.getDate() + diff);
  return normalized;
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
 * Calculates approved weekly hours for a user.
 * @param {string} userId User id.
 * @param {string|Date} weekStartDate Start date of the reporting week.
 * @returns {Promise<object>} Weekly hours summary.
 */
async function calculateWeeklyHours(userId, weekStartDate) {
  assertNonEmptyString(userId, 'userId');
  const weekStart = normalizeToStartOfDay(toDate(weekStartDate, 'weekStartDate'));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  let totalHours = 0;
  const approvedClaims = await claimModel.listClaims({ claimed_by: userId, status: 'approved' });
  const shifts = await Promise.all(approvedClaims.map((claim) => shiftModel.getShiftById(claim.shift_id)));
  for (const shiftRecord of shifts) {
    if (!shiftRecord) {
      continue;
    }
    const shift = mapShift(shiftRecord);
    const shiftDate = normalizeToStartOfDay(new Date(shift.shiftDate));
    if (shiftDate >= weekStart && shiftDate < weekEnd) {
      totalHours += shiftDurationHours(shift);
    }
  }

  return {
    userId,
    weekStartDate: weekStart.toISOString().slice(0, 10),
    totalHours: Number(totalHours.toFixed(2))
  };
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

/**
 * Flags if projected weekly hours exceed 40 hours.
 * @param {string} userId User id.
 * @param {number} additionalShiftHours Additional hours under review.
 * @returns {Promise<object>} Overtime risk result.
 */
async function checkOvertimeRisk(userId, additionalShiftHours) {
  assertNonEmptyString(userId, 'userId');
  assertNumber(additionalShiftHours, 'additionalShiftHours');
  if (additionalShiftHours < 0) {
    throw new ServiceError('additionalShiftHours must be zero or greater');
  }

  const currentWeekStart = mondayStart(new Date());
  const weeklyHours = await calculateWeeklyHours(userId, currentWeekStart);
  const projectedHours = Number((weeklyHours.totalHours + additionalShiftHours).toFixed(2));
  const isOvertimeRisk = projectedHours > WEEKLY_HOUR_LIMIT;

  const { logAction } = require('./auditService');
  await logAction(userId, 'overtime_risk_checked', 'overtime', userId, {
    weekStartDate: weeklyHours.weekStartDate,
    currentHours: weeklyHours.totalHours,
    additionalShiftHours,
    projectedHours,
    threshold: WEEKLY_HOUR_LIMIT,
    isOvertimeRisk
  });

  return {
    userId,
    weekStartDate: weeklyHours.weekStartDate,
    currentHours: weeklyHours.totalHours,
    additionalShiftHours,
    projectedHours,
    threshold: WEEKLY_HOUR_LIMIT,
    isOvertimeRisk
  };
}

module.exports = {
  calculateWeeklyHours,
  checkOvertimeRisk
};
