const db = require('../services/inMemoryDb');

const SHIFT_TIME_BLOCKS = [
  { start: '06:00', end: '14:00' },
  { start: '07:00', end: '15:00' },
  { start: '08:00', end: '16:00' },
  { start: '09:00', end: '17:00' },
  { start: '14:00', end: '22:00' },
  { start: '15:00', end: '23:00' },
  { start: '22:00', end: '06:00' }
];

const SHIFT_ROLES = ['cashier', 'stocker', 'barista', 'cook', 'supervisor', 'customer_service'];
const LOCATIONS = ['Downtown', 'Riverside', 'Northgate', 'Uptown', 'Lakeside'];
const APPROVAL_NOTES = {
  approved: [
    'Coverage confirmed. No staffing conflicts.',
    'Approved after schedule review.',
    'Approved. Overtime risk reviewed with employee.',
    'Approved due to urgent coverage need.'
  ],
  rejected: [
    'Rejected due to overtime cap risk.',
    'Rejected. Required certification mismatch for role.',
    'Rejected because minimum floor coverage would be impacted.',
    'Rejected pending staffing backfill.'
  ]
};

const FIRST_NAMES = [
  'Avery', 'Jordan', 'Priya', 'Mateo', 'Sofia', 'Noah', 'Aaliyah', 'Ethan', 'Camila', 'Lucas',
  'Zara', 'Daniel', 'Leila', 'Hugo', 'Imani', 'Rina', 'Omar', 'Mei', 'Amara', 'Elijah',
  'Fatima', 'Kai', 'Isabella', 'Dev', 'Mina', 'Luis', 'Nia', 'Andre'
];

const LAST_NAMES = [
  'Nguyen', 'Patel', 'Garcia', 'Johnson', 'Kim', 'Singh', 'Brown', 'Hernandez', 'Lee', 'Ali',
  'Torres', 'Wilson', 'Martinez', 'Clark', 'Lopez', 'Reyes', 'Campbell', 'Khan', 'Miller', 'Scott'
];

/**
 * Random integer in range.
 *
 * @param {number} min - Inclusive minimum.
 * @param {number} max - Inclusive maximum.
 * @returns {number}
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick random array element.
 *
 * @param {Array} list - Source list.
 * @returns {*}
 */
function pick(list) {
  return list[randomInt(0, list.length - 1)];
}

/**
 * Convert date to YYYY-MM-DD.
 *
 * @param {Date} date - Date object.
 * @returns {string}
 */
function toDateString(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Shift date helper.
 *
 * @param {number} dayOffset - Days from today.
 * @returns {Date}
 */
function relativeDate(dayOffset) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

/**
 * Generates realistic demo users.
 *
 * @returns {object[]} Users.
 */
function generateDemoUsers() {
  const employeeCount = randomInt(10, 15);
  const leadershipCount = randomInt(5, 10);
  const adminCount = Math.min(randomInt(1, 2), leadershipCount - 1);
  const managerCount = leadershipCount - adminCount;

  const users = [];
  let serial = 1;
  let nameCursor = 0;
  const now = new Date();

  const createUser = (role, employeePrefix) => {
    const firstName = FIRST_NAMES[nameCursor % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(nameCursor * 3) % LAST_NAMES.length];
    nameCursor += 1;

    const fullName = `${firstName} ${lastName}`;
    const id = `user_${String(serial).padStart(3, '0')}`;
    const employeeId = `${employeePrefix}-${String(1000 + serial)}`;
    const email = `${firstName}.${lastName}${serial}@shiftswap-demo.local`.toLowerCase();
    const phone = `+1-555-${String(1100 + serial).padStart(4, '0')}`;
    const createdAt = new Date(now.getTime() - (randomInt(15, 180) * 24 * 60 * 60 * 1000));

    serial += 1;

    return {
      id,
      employee_id: employeeId,
      name: fullName,
      email,
      phone,
      role,
      created_at: createdAt.toISOString(),
      updated_at: createdAt.toISOString()
    };
  };

  for (let i = 0; i < employeeCount; i += 1) {
    users.push(createUser('employee', 'EMP'));
  }

  for (let i = 0; i < managerCount; i += 1) {
    users.push(createUser('manager', 'MGR'));
  }

  for (let i = 0; i < adminCount; i += 1) {
    users.push(createUser('admin', 'ADM'));
  }

  return users;
}

/**
 * Generates realistic demo shifts.
 *
 * @param {object[]} users - User set.
 * @returns {object[]} Shifts.
 */
function generateDemoShifts(users) {
  const shiftCount = randomInt(24, 30);
  const employees = users.filter((user) => user.role === 'employee');
  const shifts = [];
  const statuses = ['open', 'claimed', 'approved', 'rejected', 'cancelled'];
  const now = new Date();

  for (let i = 0; i < shiftCount; i += 1) {
    const poster = pick(employees);
    const block = pick(SHIFT_TIME_BLOCKS);
    const dayOffset = randomInt(-21, 21);
    const status = statuses[i % statuses.length];
    const shiftDate = relativeDate(dayOffset);
    const createdAt = new Date(shiftDate.getTime() - (randomInt(1, 7) * 24 * 60 * 60 * 1000));
    const updatedAt = new Date(createdAt.getTime() + (randomInt(2, 72) * 60 * 60 * 1000));

    shifts.push({
      id: `shift_${String(i + 1).padStart(3, '0')}`,
      posted_by: poster.id,
      shift_date: toDateString(shiftDate),
      start_time: block.start,
      end_time: block.end,
      role_name: pick(SHIFT_ROLES),
      location: pick(LOCATIONS),
      status,
      overtime_risk: Math.random() < 0.2,
      scenario: dayOffset < 0 ? 'historical' : 'upcoming',
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString()
    });
  }

  const unclaimedEscalation = shifts.filter((shift) => shift.status === 'open').slice(0, 2);
  unclaimedEscalation.forEach((shift, index) => {
    const start = new Date(now.getTime() + ((index + 2) * 60 * 60 * 1000));
    const end = new Date(start.getTime() + (8 * 60 * 60 * 1000));
    shift.shift_date = toDateString(start);
    shift.start_time = `${String(start.getHours()).padStart(2, '0')}:00`;
    shift.end_time = `${String(end.getHours()).padStart(2, '0')}:00`;
    shift.scenario = 'escalation_candidate';
  });

  const approvedHistorical = shifts.filter((shift) => shift.status === 'approved').slice(0, 4);
  approvedHistorical.forEach((shift) => {
    shift.shift_date = toDateString(relativeDate(-randomInt(4, 20)));
    shift.scenario = 'historical_completed_swap';
  });

  const overtimeCandidates = shifts.filter((shift) => shift.status === 'approved').slice(0, 3);
  overtimeCandidates.forEach((shift) => {
    shift.overtime_risk = true;
    shift.scenario = 'overtime_risk';
  });

  return shifts;
}

/**
 * Generates claims for eligible shifts.
 *
 * @param {object[]} shifts - Shift list.
 * @param {object[]} users - User list.
 * @returns {object[]} Claims.
 */
function generateDemoClaims(shifts, users) {
  const employees = users.filter((user) => user.role === 'employee');
  const claimable = shifts.filter((shift) => ['claimed', 'approved', 'rejected'].includes(shift.status));
  const claims = [];

  claimable.forEach((shift, index) => {
    const candidates = employees.filter((employee) => employee.id !== shift.posted_by);
    const claimer = pick(candidates.length > 0 ? candidates : employees);
    const baseTime = new Date(shift.created_at);
    const claimDate = new Date(baseTime.getTime() + (randomInt(1, 30) * 60 * 60 * 1000));
    const statusMap = {
      claimed: 'pending',
      approved: 'approved',
      rejected: 'rejected'
    };

    claims.push({
      id: `claim_${String(index + 1).padStart(3, '0')}`,
      shift_id: shift.id,
      claimed_by: claimer.id,
      claim_date: claimDate.toISOString(),
      status: statusMap[shift.status] || 'pending',
      created_at: claimDate.toISOString(),
      updated_at: claimDate.toISOString()
    });
  });

  return claims;
}

/**
 * Generates approval decisions from manager/admin users.
 *
 * @param {object[]} claims - Claim records.
 * @param {object[]} users - User list.
 * @returns {object[]} Approvals.
 */
function generateDemoApprovals(claims, users) {
  const leaders = users.filter((user) => user.role === 'manager' || user.role === 'admin');
  const approvals = [];
  let approvalIndex = 1;

  claims.forEach((claim) => {
    if (claim.status !== 'approved' && claim.status !== 'rejected') {
      return;
    }

    const manager = pick(leaders);
    const decisionDate = new Date(new Date(claim.claim_date).getTime() + (randomInt(2, 20) * 60 * 60 * 1000));
    const decision = claim.status === 'approved' ? 'approved' : 'rejected';

    approvals.push({
      id: `approval_${String(approvalIndex).padStart(3, '0')}`,
      claim_id: claim.id,
      manager_id: manager.id,
      decision,
      decision_date: decisionDate.toISOString(),
      notes: pick(APPROVAL_NOTES[decision]),
      created_at: decisionDate.toISOString()
    });

    approvalIndex += 1;
  });

  return approvals;
}

/**
 * Generates audit records representing shift/claim/approval lifecycle.
 *
 * @param {object[]} users - User records.
 * @param {object[]} shifts - Shift records.
 * @param {object[]} claims - Claim records.
 * @param {object[]} approvals - Approval records.
 * @returns {object[]} Audit log entries.
 */
function generateDemoAuditLog(users, shifts, claims, approvals) {
  const claimByShiftId = new Map(claims.map((claim) => [claim.shift_id, claim]));
  const approvalByClaimId = new Map(approvals.map((approval) => [approval.claim_id, approval]));
  const audit = [];
  let counter = 1;

  shifts.forEach((shift) => {
    audit.push({
      id: `audit_${String(counter).padStart(4, '0')}`,
      user_id: shift.posted_by,
      action: 'shift_posted',
      entity_type: 'shift',
      entity_id: shift.id,
      details: JSON.stringify({ role: shift.role_name, location: shift.location, status: shift.status }),
      timestamp: shift.created_at,
      ip_address: '127.0.0.1'
    });
    counter += 1;

    const claim = claimByShiftId.get(shift.id);
    if (!claim) {
      if (shift.scenario === 'escalation_candidate') {
        audit.push({
          id: `audit_${String(counter).padStart(4, '0')}`,
          user_id: shift.posted_by,
          action: 'shift_escalated',
          entity_type: 'shift',
          entity_id: shift.id,
          details: JSON.stringify({ reason: 'Unclaimed within escalation window' }),
          timestamp: new Date(new Date(shift.shift_date).getTime() - (4 * 60 * 60 * 1000)).toISOString(),
          ip_address: '127.0.0.1'
        });
        counter += 1;
      }
      return;
    }

    audit.push({
      id: `audit_${String(counter).padStart(4, '0')}`,
      user_id: claim.claimed_by,
      action: 'shift_claimed',
      entity_type: 'claim',
      entity_id: claim.id,
      details: JSON.stringify({ shift_id: shift.id, status: claim.status }),
      timestamp: claim.claim_date,
      ip_address: '127.0.0.1'
    });
    counter += 1;

    const approval = approvalByClaimId.get(claim.id);
    if (approval) {
      audit.push({
        id: `audit_${String(counter).padStart(4, '0')}`,
        user_id: approval.manager_id,
        action: approval.decision === 'approved' ? 'claim_approved' : 'claim_rejected',
        entity_type: 'approval',
        entity_id: approval.id,
        details: JSON.stringify({ claim_id: claim.id, notes: approval.notes }),
        timestamp: approval.decision_date,
        ip_address: '127.0.0.1'
      });
      counter += 1;
    }
  });

  return audit.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/**
 * Ensure in-memory collections exist.
 *
 * @param {object} database - Data container.
 */
function ensureCollections(database) {
  const mapKeys = ['users', 'shifts', 'claims', 'approvals', 'notifications', 'auditLogs'];
  mapKeys.forEach((key) => {
    if (!database[key]) {
      database[key] = new Map();
    }
  });

  if (!database.counters) {
    database.counters = {};
  }
}

/**
 * Clear demo records from database.
 *
 * @param {object} [database=db] - Database container.
 */
function clearExistingDemoData(database = db) {
  ensureCollections(database);
  database.users.clear();
  database.shifts.clear();
  database.claims.clear();
  database.approvals.clear();
  database.notifications.clear();
  database.auditLogs.clear();
  database.counters = {
    user: 1,
    shift: 1,
    claim: 1,
    approval: 1,
    notification: 1,
    audit: 1
  };
}

/**
 * Populate the database with generated demo data.
 *
 * @param {{ database?: object, force?: boolean }} [options={}] - Optional behavior overrides.
 * @returns {Promise<object>} Summary details.
 */
async function populateDatabase(options = {}) {
  const { database = db, force = false } = options;
  const demoModeEnabled = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';

  if (!demoModeEnabled && !force) {
    console.log('[demoData] DEMO_MODE disabled. Skipping demo population.');
    return {
      created: false,
      reason: 'DEMO_MODE is not enabled',
      counts: { users: 0, shifts: 0, claims: 0, approvals: 0, audit: 0 }
    };
  }

  try {
    console.log('[demoData] Resetting existing demo records...');
    clearExistingDemoData(database);

    console.log('[demoData] Generating users...');
    const users = generateDemoUsers();
    console.log('[demoData] Generating shifts...');
    const shifts = generateDemoShifts(users);
    console.log('[demoData] Generating claims...');
    const claims = generateDemoClaims(shifts, users);
    console.log('[demoData] Generating approvals...');
    const approvals = generateDemoApprovals(claims, users);
    console.log('[demoData] Generating audit log...');
    const auditLogs = generateDemoAuditLog(users, shifts, claims, approvals);

    ensureCollections(database);
    users.forEach((user) => database.users.set(user.id, user));
    shifts.forEach((shift) => database.shifts.set(shift.id, shift));
    claims.forEach((claim) => database.claims.set(claim.id, claim));
    approvals.forEach((approval) => database.approvals.set(approval.id, approval));
    auditLogs.forEach((audit) => database.auditLogs.set(audit.id, audit));

    const summary = {
      created: true,
      counts: {
        users: users.length,
        shifts: shifts.length,
        claims: claims.length,
        approvals: approvals.length,
        audit: auditLogs.length
      }
    };

    console.log('[demoData] Demo data population complete.', summary);
    return summary;
  } catch (error) {
    console.error('[demoData] Failed to populate demo data:', error);
    throw error;
  }
}

/**
 * Reset and repopulate demo data.
 *
 * @param {{ database?: object }} [options={}] - Optional database override.
 * @returns {Promise<object>}
 */
async function resetDemoData(options = {}) {
  const { database = db } = options;
  console.log('[demoData] Performing full demo reset...');
  clearExistingDemoData(database);
  return populateDatabase({ database, force: true });
}

module.exports = {
  generateDemoUsers,
  generateDemoShifts,
  generateDemoClaims,
  generateDemoApprovals,
  generateDemoAuditLog,
  populateDatabase,
  resetDemoData
};
