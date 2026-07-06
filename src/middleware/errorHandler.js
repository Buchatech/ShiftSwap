/**
 * Creates an HTTP error with status and code metadata.
 * @param {number} status
 * @param {string} message
 * @param {string} [code]
 * @param {object} [details]
 * @returns {Error & {status:number,code:string,details?:object}}
 */
function createHttpError(status, message, code, details) {
  const error = new Error(message);
  error.status = status;
  error.code = code || 'REQUEST_ERROR';

  if (details && typeof details === 'object') {
    error.details = details;
  }

  return error;
}

/**
 * Express global error-handling middleware.
 * @param {Error & {status?:number,code?:string,details?:object}} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
function errorHandler(err, req, res, next) {
  const status = Number.isInteger(err.status) ? err.status : 500;
  const code = err.code || (status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR');
  const message = status >= 500 ? 'An unexpected server error occurred.' : err.message;

  const logPayload = {
    method: req.method,
    path: req.originalUrl,
    status,
    code,
    message: err.message
  };

  if (status >= 500) {
    console.error('[ShiftSwap API Error]', logPayload, err);
  } else {
    console.warn('[ShiftSwap API Warning]', logPayload);
  }

  const response = {
    error: {
      code,
      message
    }
  };

  if (err.details) {
    response.error.details = err.details;
  }

  if (process.env.NODE_ENV !== 'production' && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(status).json(response);
}

module.exports = {
  createHttpError,
  errorHandler
};
