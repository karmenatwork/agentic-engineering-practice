const taskRepository = require('../repositories/tasks');
const { VALID_TASK_STATUSES, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = require('../constants');

function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

/**
 * @description Validates list filters from the query string and returns the matching page of tasks.
 * @param {object} [query] - Raw query-string values.
 * @param {string} [query.status] - One of VALID_TASK_STATUSES.
 * @param {string} [query.project_id] - Project id to filter by.
 * @param {string} [query.assignee_id] - Assignee user id to filter by.
 * @param {string} [query.tag] - Tag name to filter by; matched case-insensitively, ignoring surrounding spaces.
 * @param {string} [query.page] - 1-based page number.
 * @param {string} [query.page_size] - Items per page, capped at MAX_PAGE_SIZE.
 * @returns {object[]} Matching task rows.
 * @throws {Error & {status: 400}} When status or tag is invalid.
 */
function listTasks({ status, project_id, assignee_id, tag, page, page_size } = {}) {
  if (status && !VALID_TASK_STATUSES.includes(status)) {
    throw badRequest(`status must be one of: ${VALID_TASK_STATUSES.join(', ')}`);
  }

  let tagName;
  if (tag !== undefined) {
    // Tags are stored lowercased and trimmed (see POST /tags), so normalize the same way.
    tagName = typeof tag === 'string' ? tag.trim().toLowerCase() : '';
    if (!tagName) throw badRequest('tag must be a non-empty tag name');
  }

  const limit = Math.min(MAX_PAGE_SIZE, parseInt(page_size) || DEFAULT_PAGE_SIZE);
  const offset = ((parseInt(page) || 1) - 1) * limit;

  return taskRepository.findTasks({
    status: status || undefined,
    projectId: project_id ? parseInt(project_id) : undefined,
    assigneeId: assignee_id ? parseInt(assignee_id) : undefined,
    tag: tagName,
    limit,
    offset
  });
}

module.exports = { listTasks };
