/**
 * @description Converts a date string to an ISO 8601 string, returning null for empty or invalid input.
 * @param {string} dateStr - Date string to parse.
 * @returns {string|null} The ISO date string, or null.
 */
function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * @description Converts a string to a lowercase, hyphen-separated URL slug.
 * @param {string} str - Text to slugify.
 * @returns {string} The slug.
 */
function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

/**
 * @description Shortens a string to a maximum length and appends an ellipsis when it was cut.
 * @param {string} str - Text to truncate.
 * @param {number} len - Maximum number of characters to keep.
 * @returns {string} The original string if short enough or empty, otherwise the truncated string ending in '...'.
 */
function truncate(str, len) {
  if (!str || str.length <= len) return str;
  return str.slice(0, len) + '...';
}

/**
 * @description Checks whether a value looks like a valid email address.
 * @param {string} email - Value to check.
 * @returns {boolean} True if the value matches the email pattern.
 */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * @description Checks whether a value is a string that contains non-whitespace characters.
 * @param {*} val - Value to check.
 * @returns {boolean} True if the value is a non-blank string.
 */
function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

/**
 * @description Builds pagination metadata, including the total page count.
 * @param {number} total - Total number of items.
 * @param {number} page - Current page number.
 * @param {number} pageSize - Items per page.
 * @returns {{total: number, page: number, pageSize: number, totalPages: number}} The pagination metadata object.
 */
function buildPaginationMeta(total, page, pageSize) {
  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

/**
 * @description Parses a base-10 integer, returning a fallback when parsing fails.
 * @param {*} val - Value to parse.
 * @param {number} fallback - Value returned when val is not a number.
 * @returns {number} The parsed integer, or the fallback.
 */
function parseIntSafe(val, fallback) {
  const n = parseInt(val, 10);
  return isNaN(n) ? fallback : n;
}

module.exports = { formatDate, slugify, truncate, validateEmail, isNonEmptyString, buildPaginationMeta, parseIntSafe };
