const express = require("express");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const asyncHandler = require("../middleware/asyncHandler");
const {
  createTaskSchema,
  updateTaskSchema,
} = require("../schemas/task.schema");
const {
  getTasks,
  getAllTasksAdmin,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/task.controller");
const router = express.Router();
// router-level middleware, every route below needs a logged in user
router.use(authenticate);
// route-level middleware: authorize only on this route
// keep it above "/:id" or express will think "admin" is an id
router.get("/admin/all", authorize("admin"), asyncHandler(getAllTasksAdmin));
router.get("/", asyncHandler(getTasks));
router.get("/:id", asyncHandler(getTask));
// route-level chain: validate runs first, then controller
router.post("/", validate(createTaskSchema), asyncHandler(createTask));
router.patch("/:id", validate(updateTaskSchema), asyncHandler(updateTask));
router.delete("/:id", asyncHandler(deleteTask));
module.exports = router;
