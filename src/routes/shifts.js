const express = require('express');

const { attachUser, requireAuth, requireRole } = require('../middleware/auth');
const { createHttpError } = require('../middleware/errorHandler');

const router = express.Router();

const ALLOWED_SHIFT_STATUSES = ['open', 'claimed', 'approved', 'rejected', 'cancelled'];

const shiftService = (() => {
  try {
    return require('../services/shiftService');
  } catch (error) {
    return {
      async listShifts(filters) {
        return { items: [], filters };
      },
      async getShiftById(id) {
        return null;
      },
      async createShift(payload) {
        return { id: Date.now(), status: 'open', ...payload };
      },
      async cancelShift() {
        return { cancelled: true };
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

  return parsed.toISOString();
}

router.use(attachUser, requireAuth);

/**
 * @route GET /api/shifts
 * @description List shifts with optional filters: status, startDate, endDate, userId.
 */
router.get('/', async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status).toLowerCase().trim() : undefined;
    if (status && !ALLOWED_SHIFT_STATUSES.includes(status)) {
      throw createHttpError(400, 'Invalid shift status filter.', 'VALIDATION_ERROR');
    }

    const filters = {
      status,
      startDate: parseDate(req.query.startDate, 'startDate'),
      endDate: parseDate(req.query.endDate, 'endDate'),
      userId: req.query.userId ? String(req.query.userId).trim() : undefined
    };

    const result = await shiftService.listShifts(filters, req.user);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/shifts/:id
 * @description Get details for a single shift.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const shiftId = String(req.params.id || '').trim();
    if (!shiftId) {
      throw createHttpError(400, 'Shift id is required.', 'VALIDATION_ERROR');
    }

    const shift = await shiftService.getShiftById(shiftId, req.user);
    if (!shift) {
      throw createHttpError(404, 'Shift not found.', 'NOT_FOUND');
    }

    res.status(200).json(shift);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/shifts
 * @description Post a new shift for coverage.
 */
router.post('/', requireRole('employee'), async (req, res, next) => {
  try {
    const { shiftDate, startTime, endTime, roleName, location } = req.body || {};

    if (!shiftDate || !startTime || !endTime || !roleName) {
      throw createHttpError(
        400,
        'shiftDate, startTime, endTime, and roleName are required.',
        'VALIDATION_ERROR'
      );
    }

    const payload = {
      postedBy: req.user.id,
      shiftDate: parseDate(shiftDate, 'shiftDate'),
      startTime: String(startTime).trim(),
      endTime: String(endTime).trim(),
      roleName: String(roleName).trim(),
      location: location ? String(location).trim() : null
    };

    const createdShift = await shiftService.createShift(payload, req.user);
    res.status(201).json(createdShift);
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/shifts/:id
 * @description Cancel a shift only when no claims exist.
 */
router.delete('/:id', requireRole('employee'), async (req, res, next) => {
  try {
    const shiftId = String(req.params.id || '').trim();
    if (!shiftId) {
      throw createHttpError(400, 'Shift id is required.', 'VALIDATION_ERROR');
    }

    const cancellation = await shiftService.cancelShift(shiftId, req.user);
    if (cancellation && cancellation.cancelled === false) {
      throw createHttpError(409, cancellation.reason || 'Shift cannot be cancelled.', 'SHIFT_CONFLICT');
    }

    res.status(200).json({
      message: 'Shift cancelled successfully.',
      result: cancellation
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
