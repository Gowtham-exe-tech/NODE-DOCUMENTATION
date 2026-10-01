const tasks = [
    {
        id: 1,
        title: "Build login API",
        description: "Create authentication endpoints",
        status: "pending",
        priority: "high",
        userId: 101
    },
    {
        id: 2,
        title: "Create dashboard UI",
        description: "Build the admin dashboard",
        status: "in-progress",
        priority: "medium",
        userId: 102
    },
    {
        id: 3,
        title: "Write API tests",
        description: "Test all task endpoints",
        status: "completed",
        priority: "low",
        userId: 101
    },
    {
        id: 4,
        title: "Fix notification bug",
        description: "Investigate email notification failure",
        status: "pending",
        priority: "high",
        userId: 103
    },
    {
        id: 5,
        title: "Update documentation",
        description: "Document API endpoints",
        status: "in-progress",
        priority: "low",
        userId: 102
    },
    {
        id: 6,
        title: "Deploy backend",
        description: "Deploy API to server",
        status: "pending",
        priority: "medium",
        userId: 101
    }
];

const comments = [
    {
        id: 1,
        taskId: 1,
        author: "Gowtham",
        message: "Started working on authentication."
    },
    {
        id: 2,
        taskId: 1,
        author: "Arun",
        message: "Remember to validate the password."
    },
    {
        id: 3,
        taskId: 2,
        author: "Priya",
        message: "Dashboard layout is ready."
    },
    {
        id: 4,
        taskId: 3,
        author: "Gowtham",
        message: "Added API test cases."
    }
];

module.exports = {
    tasks,
    comments
};