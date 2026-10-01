const AppError = require("../errors/AppError");
const tasks = require("../data/tasks");
const sendSuccess = require("../utils/sendSuccess");
let taskCounter = tasks.length; // used to make new ids like task-4
// helper: finds the task, 404 if missing, 403 if it is not the user's task
const findOwnedTask = (taskId, userId) => {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) throw new AppError("Task not found", 404);
  if (task.ownerId !== userId)
    throw new AppError("You do not own this task", 403);
  return task;
};
// helper: same user cannot have two tasks with the same title
const titleAlreadyUsed = (ownerId, title, ignoreId = null) =>
  tasks.some(
    (item) =>
      item.ownerId === ownerId &&
      item.id !== ignoreId &&
      item.title.toLowerCase() === title.toLowerCase(),
  );
// GET /api/tasks, only my tasks
const getTasks = async (req, res) => {
  const myTasks = tasks.filter((item) => item.ownerId === res.locals.user.id);
  sendSuccess(res, 200, myTasks);
};
// GET /api/tasks/admin/all, admin only (authorize is on the route)
const getAllTasksAdmin = async (req, res) => {
  sendSuccess(res, 200, tasks);
};
// GET /api/tasks/:id
const getTask = async (req, res) => {
  const task = findOwnedTask(req.params.id, res.locals.user.id);
  sendSuccess(res, 200, task);
};
// POST /api/tasks, body was already checked by validate()
const createTask = async (req, res) => {
  const data = res.locals.validatedBody;
  const ownerId = res.locals.user.id; // owner comes from the logged in user, not from the body
  if (titleAlreadyUsed(ownerId, data.title))
    throw new AppError("You already have a task with this title", 409);
  taskCounter += 1;
  const now = new Date().toISOString();
  const newTask = {
    id: `task-${taskCounter}`,
    title: data.title,
    description: data.description || "",
    priority: data.priority,
    status: data.status || "pending",
    dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
    tags: data.tags || [],
    ownerId,
    createdAt: now,
    updatedAt: now,
  };
  tasks.push(newTask);
  sendSuccess(res, 201, newTask);
};
// PATCH /api/tasks/:id, only changes the fields that were sent
const updateTask = async (req, res) => {
  const data = res.locals.validatedBody;
  const task = findOwnedTask(req.params.id, res.locals.user.id);
  if (data.title && titleAlreadyUsed(task.ownerId, data.title, task.id))
    throw new AppError("You already have a task with this title", 409);
  if (data.dueDate) data.dueDate = new Date(data.dueDate).toISOString();
  Object.assign(task, data, { updatedAt: new Date().toISOString() }); // merge changes into the task
  sendSuccess(res, 200, task);
};
// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  const task = findOwnedTask(req.params.id, res.locals.user.id);
  const taskIndex = tasks.indexOf(task);
  tasks.splice(taskIndex, 1); // remove from array
  res.status(204).send(); // 204 = success but no body
};
module.exports = {
  getTasks,
  getAllTasksAdmin,
  getTask,
  createTask,
  updateTask,
  deleteTask,
};
