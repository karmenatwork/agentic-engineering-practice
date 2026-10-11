const PORT = process.env.PORT || 3000;
// Task constants now live in src/constants.js; re-exported here so existing imports keep working.
const { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, VALID_TASK_STATUSES } = require('../src/constants');
const EMAIL_FROM = 'noreply@taskr.io';

// These helpers belong in utils.js but ended up here
/**
 * @description Builds an error response body with a message and code.
 * @param {string} message - Error message.
 * @param {string|number} code - Error code.
 * @returns {{error: string, code: (string|number)}} The error object.
 */
function formatError(message, code) {
  return { error: message, code };
}

/**
 * @description Converts page and page-size inputs into a SQL limit and offset, clamping page size to MAX_PAGE_SIZE.
 * @param {string|number} page - 1-based page number; defaults to 1.
 * @param {string|number} pageSize - Items per page; defaults to DEFAULT_PAGE_SIZE.
 * @returns {{limit: number, offset: number}} Limit and offset for the query.
 */
function paginate(page, pageSize) {
  const p = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(MAX_PAGE_SIZE, parseInt(pageSize) || DEFAULT_PAGE_SIZE);
  return { limit: ps, offset: (p - 1) * ps };
}

module.exports = { PORT, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, VALID_TASK_STATUSES, EMAIL_FROM, formatError, paginate };
