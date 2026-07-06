const ROLE_RANK = {
  employee: 1,
  manager: 2,
  admin: 3
};

/**
 * Attaches a session user object to req.user when available.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function attachUser(req, res, next) {
  const sessionUser = req.session && req.session.user ? req.session.user : null;
  req.user = sessionUser;
  next();
}

/**
 * Ensures the request has an authenticated user.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication is required for this endpoint.'
      }
    });
  }

  return next();
}

/**
 * Ensures the authenticated user has at least the required role.
 * employee < manager < admin
 * @param {'employee'|'manager'|'admin'} role
 * @returns {import('express').RequestHandler}
 */
function requireRole(role) {
  const normalizedRole = String(role || '').toLowerCase();

  if (!ROLE_RANK[normalizedRole]) {
    throw new Error(`Invalid role passed to requireRole: ${role}`);
  }

  return function roleGuard(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication is required for this endpoint.'
        }
      });
    }

    const userRole = String(req.user.role || '').toLowerCase();
    if (!ROLE_RANK[userRole] || ROLE_RANK[userRole] < ROLE_RANK[normalizedRole]) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: `This endpoint requires ${normalizedRole} role or higher.`
        }
      });
    }

    return next();
  };
}

module.exports = {
  attachUser,
  requireAuth,
  requireRole
};
