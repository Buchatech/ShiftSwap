const express = require('express');

const { attachUser, requireAuth, requireRole } = require('../middleware/auth');
const { createHttpError } = require('../middleware/errorHandler');

const router = express.Router();

const reportService = (() => {
  try {
    return require('../services/reportService');
  } catch (error) {
    return {
      async getAuditTrail(filters) {
        return { items: [], filters };
      },
      async exportAuditCsv() {
        return 'timestamp,user_id,action\n';
      },
      async getOvertimeRisk() {
        return [];
      }
    };
  }
})();

function parseDate(value, label) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw createHttpError(400, `${label} must be a valid date.`, 'VALIDATION_ERROR');
  }

  return parsed;
}

router.use(attachUser, requireAuth, requireRole('manager'));

/**
 * @route GET /api/reports/audit
 * @description Return audit trail with optional date/user/action filters.
 */
router.get('/audit', async (req, res, next) => {
  try {
    const filters = {
      startDate: parseDate(req.query.startDate, 'startDate'),
      endDate: parseDate(req.query.endDate, 'endDate'),
      userId: req.query.userId ? String(req.query.userId).trim() : undefined,
      action: req.query.action ? String(req.query.action).trim() : undefined
    };

    const audit = await reportService.getAuditTrail(filters, req.user);
    res.status(200).json(audit);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/reports/export
 * @description Export audit trail to CSV, constrained to 90 days max.
 */
router.get('/export', async (req, res, next) => {
  try {
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 90);

    const startDate = parseDate(req.query.startDate, 'startDate') || defaultStart;
    const endDate = parseDate(req.query.endDate, 'endDate') || now;

    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > ninetyDaysMs) {
      throw createHttpError(400, 'Export window cannot exceed 90 days.', 'VALIDATION_ERROR');
    }

    const csv = await reportService.exportAuditCsv({ startDate, endDate }, req.user);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-export.csv"');
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/reports/overtime-risk
 * @description Return users flagged for overtime risk.
 */
router.get('/overtime-risk', async (req, res, next) => {
  try {
    const overtimeRisk = await reportService.getOvertimeRisk(req.user);
    res.status(200).json(overtimeRisk);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
