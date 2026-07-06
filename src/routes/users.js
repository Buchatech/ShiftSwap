const express = require('express');

const { attachUser, requireAuth, requireRole } = require('../middleware/auth');
const { createHttpError } = require('../middleware/errorHandler');

const router = express.Router();

const userService = (() => {
  try {
    return require('../services/userService');
  } catch (error) {
    return {
      async getCurrentUser(userId) {
        return {
          id: userId,
          employeeId: userId,
          name: `Employee ${userId}`,
          role: 'employee'
        };
      },
      async listUsers() {
        return [];
      }
    };
  }
})();

router.use(attachUser, requireAuth);

/**
 * @route GET /api/users/me
 * @description Get current authenticated user details.
 */
router.get('/me', async (req, res, next) => {
  try {
    const user = await userService.getCurrentUser(req.user.id, req.user);
    if (!user) {
      throw createHttpError(404, 'User not found.', 'NOT_FOUND');
    }

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /api/users
 * @description List users for managers/admins.
 */
router.get('/', requireRole('manager'), async (req, res, next) => {
  try {
    const filters = {
      role: req.query.role ? String(req.query.role).trim().toLowerCase() : undefined,
      search: req.query.search ? String(req.query.search).trim() : undefined
    };
    const users = await userService.listUsers(filters, req.user);
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
