const { db } = require('./DB');
const { sendEmail } = require('./sendEmail');
const { validateEmail } = require('./utils');

/**
 * @description Validates the email, inserts a new user and sends them a welcome email.
 * @param {string} name - User's display name.
 * @param {string} email - User's email address; must be a valid format.
 * @returns {Promise<object>} Resolves with the newly created user row; rejects with a 400 error for an invalid email.
 */
async function createUser(name, email) {
  if (!validateEmail(email)) {
    const err = new Error('Invalid email address');
    err.status = 400;
    throw err;
  }
  const result = db.prepare(
    'INSERT INTO users (name, email) VALUES (?, ?)'
  ).run(name, email);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

  // Sending welcome email here belongs in a notification service, not in a controller
  await sendEmail({
    to: user.email,
    subject: 'Welcome to Taskr!',
    body: `Hi ${user.name}, your account is ready. Start managing your tasks at taskr.io.`
  });

  return user;
}

/**
 * @description Updates a user's name and/or email, keeping existing values for any field not provided.
 * @param {number} id - User ID.
 * @param {object} data - Fields to change.
 * @param {string} [data.name] - New name.
 * @param {string} [data.email] - New email address.
 * @returns {object} The updated user row; throws a 404 error if the user does not exist.
 */
function updateUser(id, data) {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const name = data.name !== undefined ? data.name : existing.name;
  const email = data.email !== undefined ? data.email : existing.email;
  db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email, id);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

/**
 * @description Deletes a user by ID.
 * @param {number} id - User ID.
 * @returns {{deleted: boolean}} `{ deleted: true }` on success; throws a 404 error if the user does not exist.
 */
function deleteUser(id) {
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (result.changes === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return { deleted: true };
}

/**
 * @description Lists all users, newest first.
 * @returns {object[]} All user rows ordered by created_at descending.
 */
function listUsers() {
  return db.prepare('SELECT * FROM users ORDER BY created_at DESC').all();
}

/**
 * @description Fetches a single user row by its primary key.
 * @param {number} id - User ID.
 * @returns {object|undefined} The user row, or undefined if no user has that ID.
 */
function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

module.exports = { createUser, updateUser, deleteUser, listUsers, getUserById };
