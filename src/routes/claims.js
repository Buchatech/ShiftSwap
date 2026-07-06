const express = require('express');

const { attachUser, requireAuth, requireRole } = require('../middleware/auth');
const { createHttpError } = require('../middleware/errorHandler');

const router = express.Router();

const claimService = (() => {
  try {
    return require('../services/claimService');
  } catch (error) {
    return {
      async createClaim(payload) {
        return { id: Date.now(), status: 'pending', ...payload };
      },
      async cancelClaim() {
        return { cancelled: true };
      },
      async getClaimById() {
        return null;
      },
      async getClaimsByUserId() {
        return [];
      }
    };
  }
})();

router.use(attachUser, requireAuth);

/**
 * @route POST /api/claims
 * @description Claim an open shift.
 */
router.post('/', requireRole('employee'), async (req, res, next) => {
  try {
    const shiftId = req.body && req.body.shiftId ? String(req.body.shiftId).trim() : '';
    if (!shiftId) {
      throw createHttpError(400, 'shiftId is required.', 'VALIDATION_ERROR');
    }

    const claim = await claimService.createClaim(
      {
        shiftId,
        claimedBy: req.user.id
      },
      req.user
    );
    res.status(201).json(claim);
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /api/claims/:id
 * @description Cancel a claim before approval.
 */
router.delete('/:id', requireRole('employee'), async (req, res, next) => {
  try {
    const claimId = String(req.params.id || '').trim();
    if (!claimId) {
      throw createHttpError(400, 'Claim id is required.', 'VALIDATION_ERROR');
    }

    const cancellation = await claimService.cancelClaim(claimId, req.user);
    if (cancellation && cancellation.cancelled === false) {
      throw createHttpError(409, cancellation.reason || 'Claim cannot be cancelled.', 'CLAIM_CONFLICT');
    }

    res.status(200).json({
      message: 'Claim cancelled successfully.',
      result: cancellation
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/claims/user/:userId
 * @description Get all claims for a user.
 */
router.get('/user/:userId', async (req, res, next) => {
  try {
    const userId = String(req.params.userId || '').trim();
    if (!userId) {
      throw createHttpError(400, 'userId is required.', 'VALIDATION_ERROR');
    }

    const isSelf = String(req.user.id) === userId;
    const role = String(req.user.role || '').toLowerCase();
    if (!isSelf && role !== 'manager' && role !== 'admin') {
      throw createHttpError(403, 'You can only access your own claims.', 'FORBIDDEN');
    }

    const claims = await claimService.getClaimsByUserId(userId, req.user);
    res.status(200).json(claims);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/claims/:id
 * @description Get details for a single claim.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const claimId = String(req.params.id || '').trim();
    if (!claimId) {
      throw createHttpError(400, 'Claim id is required.', 'VALIDATION_ERROR');
    }

    const claim = await claimService.getClaimById(claimId, req.user);
    if (!claim) {
      throw createHttpError(404, 'Claim not found.', 'NOT_FOUND');
    }

    res.status(200).json(claim);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
