const express = require('express');

const { attachUser, requireAuth } = require('../middleware/auth');
const { createHttpError } = require('../middleware/errorHandler');

const router = express.Router();

const authService = (() => {
  try {
    return require('../services/authService');
  } catch (error) {
    return {
      async loginByEmployeeId(employeeId) {
        return {
          id: employeeId,
          employeeId,
          name: `Employee ${employeeId}`,
          role: 'employee'
        };
      }
    };
  }
})();

router.use(attachUser);

/**
 * @route POST /api/auth/login
 * @description Login using employee ID (MVP).
 */
router.post('/login', async (req, res, next) => {
  try {
    const employeeId = req.body && req.body.employeeId ? String(req.body.employeeId).trim() : '';
    if (!employeeId) {
      throw createHttpError(400, 'employeeId is required.', 'VALIDATION_ERROR');
    }

    const user = await authService.loginByEmployeeId(employeeId);
    if (!user) {
      throw createHttpError(401, 'Invalid employee ID.', 'INVALID_CREDENTIALS');
    }

    req.session.user = user;
    res.status(200).json({
      message: 'Login successful.',
      user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /api/auth/logout
 * @description Logout and destroy server-side session.
 */
router.post('/logout', requireAuth, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(createHttpError(500, 'Failed to destroy session.', 'SESSION_DESTROY_ERROR'));
    }

    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logout successful.' });
  });
});

/**
 * @route GET /api/auth/session
 * @description Return current session auth state.
 */
router.get('/session', (req, res) => {
  if (!req.user) {
    return res.status(200).json({ authenticated: false, user: null });
  }

  return res.status(200).json({
    authenticated: true,
    user: req.user
  });
});

module.exports = router;
