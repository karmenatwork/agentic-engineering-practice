const { db } = require('../../DB');

/**
 * @description Lists tasks newest first, optionally filtered by status, project, assignee and tag name, with limit/offset pagination.
 * @param {object} [filters] - Optional filter and pagination options.
 * @param {string} [filters.status] - Only return tasks with this status.
 * @param {number} [filters.projectId] - Only return tasks in this project.
 * @param {number} [filters.assigneeId] - Only return tasks assigned to this user.
 * @param {string} [filters.tag] - Only return tasks that have the tag with this (already normalized) name.
 * @param {number} filters.limit - Maximum number of tasks to return.
 * @param {number} filters.offset - Number of tasks to skip.
 * @returns {object[]} Matching task rows ordered by created_at descending.
 */
function findTasks({ status, projectId, assigneeId, tag, limit, offset }) {
  let query = 'SELECT * FROM tasks';
  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (projectId) {
    conditions.push('project_id = ?');
    params.push(projectId);
  }
  if (assigneeId) {
    conditions.push('assignee_id = ?');
    params.push(assigneeId);
  }
  if (tag) {
    conditions.push(
      'EXISTS (SELECT 1 FROM task_tags tt JOIN tags tg ON tg.id = tt.tag_id WHERE tt.task_id = tasks.id AND tg.name = ?)'
    );
    params.push(tag);
  }
  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(params);
}

module.exports = { findTasks };
