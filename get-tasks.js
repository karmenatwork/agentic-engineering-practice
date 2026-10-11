const { db } = require('./DB');

/**
 * @description Fetches one task together with its tags and its comments (including each commenter's name).
 * @param {number} id - Task ID.
 * @returns {object|null} The task row with `tags` and `comments` arrays attached, or null if not found.
 */
function getTaskById(id) {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) return null;
  task.tags = db.prepare(
    'SELECT t.* FROM tags t JOIN task_tags tt ON tt.tag_id = t.id WHERE tt.task_id = ?'
  ).all(id);
  task.comments = db.prepare(
    'SELECT c.*, u.name as user_name FROM comments c JOIN users u ON u.id = c.user_id WHERE c.task_id = ? ORDER BY c.created_at ASC'
  ).all(id);
  return task;
}

module.exports = { getTaskById };
