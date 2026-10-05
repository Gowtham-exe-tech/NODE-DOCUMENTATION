import express from "express";
import tasks from "../data/task.js";



const app = express();

const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.get("/", (req, res) => {
    res.json(
        {
            message: "POC-2 Server is running"
        });
});

app.get("/health", (req, res) => {
    res.json({
        status: "ok"
    });
});

app.get("/api/v1/tasks", (req, res) => {
    res.json({
        message:"Task API is working"
    });
});

app.get("/api/v1/tasks/:id", (req, res) =>{
    
    const searchId = Number(req.params.id);

    if(Number.isNaN(searchId)){
        return res.status(400).json({
            message: "Task ID must be a number"
        });
    }
    const task = tasks.find(task => task.id === searchId);

    if(!task){
        return res.status(404).json({
            message: "Task not found"
        });
    }

    return res.status(200).json({
        task
    });
});

app.post("/api/v1/tasks", (req, res) => {
    const {title, priority} = req.body;

    if(!title || !priority){
        return res.status(400).json({
            message: "required title and priority field"
        });
    }

    const allowedPriority = ["low", "medium", "high"];

    if(!allowedPriority.includes(priority.toLowerCase())){
        return res.status(400).json({
            message: "Priority value is invalid"
        });
    }

    console.log(`after function is working`);
    res.status(201).json({
        message: "Task created successfully",
        task: req.body
    });
});

app.listen(PORT, () => {
    console.log(`server is running on Port ${PORT}`);
});