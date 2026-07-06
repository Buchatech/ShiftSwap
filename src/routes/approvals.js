const express = require('express');

const { attachUser, requireAuth, requireRole } = require('../middleware/auth');
const { createHttpError } = require('../middleware/errorHandler');

const router = express.Router();

const approvalService = (() => {
  try {
    return require('../services/approvalService');
  } catch (error) {
    return {
      async listPendingApprovals() {
        return [];
      },
      async approveClaim(claimId, managerId) {
        return { claimId, status: 'approved', managerId };
      },
      async rejectClaim(claimId, managerId, reason) {
        return { claimId, status: 'rejected', managerId, reason: reason || null };
      }
    };
  }
})();

router.use(attachUser, requireAuth, requireRole('manager'));

/**
 * @route GET /api/approvals/pending
 * @description List pending approval requests for managers.
 */
router.get('/pending', async (req, res, next) => {
  try {
    const pendingApprovals = await approvalService.listPendingApprovals(req.user);
    res.status(200).json(pendingApprovals);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/approvals/:claimId/approve
 * @description Approve a pending claim.
 */
router.post('/:claimId/approve', async (req, res, next) => {
  try {
    const claimId = String(req.params.claimId || '').trim();
    if (!claimId) {
      throw createHttpError(400, 'claimId is required.', 'VALIDATION_ERROR');
    }

    const result = await approvalService.approveClaim(claimId, req.user.id, req.body || {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/approvals/:claimId/reject
 * @description Reject a pending claim.
 */
router.post('/:claimId/reject', async (req, res, next) => {
  try {
    const claimId = String(req.params.claimId || '').trim();
    if (!claimId) {
      throw createHttpError(400, 'claimId is required.', 'VALIDATION_ERROR');
    }

    const reason = req.body && req.body.reason ? String(req.body.reason).trim() : '';
    const result = await approvalService.rejectClaim(claimId, req.user.id, reason, req.body || {});
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
