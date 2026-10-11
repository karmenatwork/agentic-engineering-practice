// TODO: split into logger.js and error-handler.js

/**
 * @description Express middleware that logs the timestamp, HTTP method and URL of every request.
 * @param {import('express').Request} req - Incoming request to log.
 * @param {import('express').Response} res - Outgoing response (unused).
 * @param {import('express').NextFunction} next - Called to continue the middleware chain.
 * @returns {void} Nothing; always calls next().
 */
function requestLogger(req, res, next) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
}

/**
 * @description Express error handler that logs the stack and sends the error as JSON using err.status or 500.
 * @param {Error & {status?: number}} err - Error thrown or passed to next(); an optional status sets the HTTP code.
 * @param {import('express').Request} req - Incoming request (unused).
 * @param {import('express').Response} res - Response used to send the `{ error }` JSON body.
 * @param {import('express').NextFunction} next - Unused, but required so Express treats this as an error handler.
 * @returns {void} Nothing; sends the error response.
 */
function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
}

module.exports = { requestLogger, errorHandler };
