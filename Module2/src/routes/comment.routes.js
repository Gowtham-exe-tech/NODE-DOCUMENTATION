const express = require("express");

const { tasks, comments } = require("../data/mockData");

const router = express.Router({
    mergeParams: true
});

// GET /api/v1/tasks/:taskId/comments
router.get("/", (req, res) => {
  const taskId = Number(req.params.taskId);

  const task = tasks.find((task) => task.id === taskId);

  if (!task) {
    return res.status(404).json({
      error: "Task not found",
    });
  }

  const taskComments = comments.filter((comment) => comment.taskId === taskId);

  res.status(200).json({
    taskId,
    totalComments: taskComments.length,
    data: taskComments,
  });
});

// POST /api/v1/tasks/:taskId/comments
router.post("/", (req, res) => {
  const taskId = Number(req.params.taskId);

  const task = tasks.find((task) => task.id === taskId);

  if (!task) {
    return res.status(404).json({
      error: "Task not found",
    });
  }

  const { author, message } = req.body;

  if (!author || !message) {
    return res.status(400).json({
      error: "author and message are required",
    });
  }

  const newComment = {
    id: comments.length + 1,
    taskId,
    author,
    message,
  };

  comments.push(newComment);

  res.status(201).json({
    message: "Comment added successfully",
    data: newComment,
  });
});

module.exports = router;
