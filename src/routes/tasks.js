const express = require('express');
const taskService = require('../services/tasks');

const tasksRouter = express.Router();

tasksRouter.get('/', (req, res, next) => {
  try {
    res.json(taskService.listTasks(req.query));
  } catch (err) {
    next(err);
  }
});

module.exports = { tasksRouter };
