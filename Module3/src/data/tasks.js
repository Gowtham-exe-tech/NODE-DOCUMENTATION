// fake database, just an array in memory (resets when server restarts)
const tasks = [];
tasks.push({ id: "task-1", title: "Complete Express middleware", description: "Learn req, res, next", priority: "high", status: "in_progress", dueDate: "2026-10-10T00:00:00.000Z", tags: ["express"], ownerId: "user-1", createdAt: "2026-10-01T09:00:00.000Z", updatedAt: "2026-10-01T09:00:00.000Z" });
tasks.push({ id: "task-2", title: "Learn Zod validation", description: "", priority: "medium", status: "pending", dueDate: null, tags: [], ownerId: "user-1", createdAt: "2026-10-01T10:00:00.000Z", updatedAt: "2026-10-01T10:00:00.000Z" });
tasks.push({ id: "task-3", title: "Prepare interview notes", description: "Explain request lifecycle", priority: "low", status: "pending", dueDate: null, tags: [], ownerId: "user-2", createdAt: "2026-10-01T11:00:00.000Z", updatedAt: "2026-10-01T11:00:00.000Z" });
module.exports = tasks;
