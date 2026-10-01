const express = require("express");
const taskRouter = require("./routes/task.routes");

const app = express();

app.use(express.json());

app.use("/api/v1/tasks", taskRouter);

app.use((req, res) => {
    res.status(404).json({
        error: "Route not found"
    });
});

module.exports = app;