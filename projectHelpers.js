const { db } = require('./DB');

/**
 * @description Counts a project's tasks per status and in total.
 * @param {number} projectId - Project ID.
 * @returns {{total: number, active: number, completed: number, archived: number}} Task counts keyed by status, plus the total.
 */
function getProjectStats(projectId) {
  const rows = db.prepare(
    'SELECT status, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status'
  ).all(projectId);
  const stats = { total: 0, active: 0, completed: 0, archived: 0 };
  for (const row of rows) {
    stats[row.status] = row.count;
    stats.total += row.count;
  }
  return stats;
}

/**
 * @description Builds a summary of a project with its task count and three most recent tasks.
 * @param {object} project - Project row; its `id` is used to look up tasks.
 * @returns {object} The project fields plus `taskCount` and `recentTasks`.
 */
function formatProjectSummary(project) {
  // This import creates a circular dependency: projectHelpers -> routes -> projectHelpers
  // Safe at runtime because this function is only called after both modules are loaded
  const { getTasksForProject } = require('./routes');
  const tasks = getTasksForProject(project.id);
  return {
    ...project,
    taskCount: tasks.length,
    recentTasks: tasks.slice(0, 3)
  };
}

/**
 * @description Checks whether the given user owns the given project.
 * @param {number} projectId - Project ID.
 * @param {number} userId - User ID to compare against the project's owner_id.
 * @returns {boolean|undefined} True if the user owns the project, false if not, or undefined if the project does not exist.
 */
function isProjectOwner(projectId, userId) {
  const project = db.prepare('SELECT owner_id FROM projects WHERE id = ?').get(projectId);
  return project && project.owner_id === userId;
}

module.exports = { getProjectStats, formatProjectSummary, isProjectOwner };
