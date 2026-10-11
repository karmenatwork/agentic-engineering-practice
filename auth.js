// TODO: replace with real JWT validation

/**
 * @description Express middleware that allows the request through only when the x-api-key header matches the configured API key.
 * @param {import('express').Request} req - Incoming request; its x-api-key header is checked.
 * @param {import('express').Response} res - Response used to send a 401 when the key is missing or wrong.
 * @param {import('express').NextFunction} next - Called to continue the chain when the key is valid.
 * @returns {void} Nothing; either calls next() or sends a 401 JSON response.
 */
function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  if (apiKey === (process.env.API_KEY || 'dev-key')) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { authenticate };
