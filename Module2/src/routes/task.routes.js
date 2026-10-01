const express = require("express");
const { tasks } = require("../data/mockData");
const commentRouter = require("./comment.routes");

const router = express.Router();

// GET /api/v1/tasks
router.get("/", (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 3;

  if (page < 1 || limit < 1) {
    return res.status(400).json({
      error: "page and limit must be positive numbers",
    });
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedTasks = tasks.slice(startIndex, endIndex);

  res.status(200).json({
    page,
    limit,
    totalTasks: tasks.length,
    totalPages: Math.ceil(tasks.length / limit),
    data: paginatedTasks,
  });
});

// GET /api/v1/tasks/:id
router.get("/:id", (req, res) => {
  const taskId = Number(req.params.id);
  
  const task = tasks.find((task) => task.id === taskId);

  if (!task) {
    return res.status(404).json({
      error: "Task not found",
    });
  }

  res.status(200).json(task);
});

// POST /api/v1/tasks
router.post("/", (req, res) => {
  const { title, description, status, priority, userId } = req.body;

  if (!title || !description || !status || !priority || !userId) {
    return res.status(400).json({
      error: "title, description, status, priority and userId are required",
    });
  }

  const newTask = {
    id: tasks.length + 1,
    title,
    description,
    status,
    priority,
    userId,
  };

  tasks.push(newTask);

  res.status(201).json({
    message: "Task created successfully",
    data: newTask,
  });
});

// PATCH /api/v1/tasks/:id
router.patch("/:id", (req, res) => {
  const taskId = Number(req.params.id);

  const task = tasks.find((task) => task.id === taskId);

  if (!task) {
    return res.status(404).json({
      error: "Task not found",
    });
  }

  const { title, description, status, priority } = req.body;

  if (title !== undefined) {
    task.title = title;
  }

  if (description !== undefined) {
    task.description = description;
  }

  if (status !== undefined) {
    task.status = status;
  }

  if (priority !== undefined) {
    task.priority = priority;
  }

  res.status(200).json({
    message: "Task updated successfully",
    data: task,
  });
});

// DELETE /api/v1/tasks/:id
router.delete("/:id", (req, res) => {
  const taskId = Number(req.params.id);

  const taskIndex = tasks.findIndex((task) => task.id === taskId);

  if (taskIndex === -1) {
    return res.status(404).json({
      error: "Task not found",
    });
  }

  tasks.splice(taskIndex, 1);

  res.status(204).send();
});

// Nested resource
router.use("/:taskId/comments", commentRouter);

module.exports = router;
