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
    
const allowedPriority = ["low", "medium", "high"];

app.get("/api/v1/tasks", (req, res) => {

    const {priority} = req.query;
    
    if(priority){
        if(!allowedPriority.includes(priority)){
            return res.status(400).json({
                message:"Priority value is Invalid"
            });
        }
       const filteredTask = tasks.filter(task => priority === task.priority);
       return res.status(200).json(filteredTask);
    }

    return res.status(200).json(tasks);
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


    if(!allowedPriority.includes(priority.toLowerCase())){
        return res.status(400).json({
            message: "Priority value is invalid"
        });
    }

    const normalizePriority = priority.toLowerCase();

    if(!allowedPriority.includes(normalizePriority)){
        return res.status(400).json({
            message: "Priority value is invalid"
        });
    }

    const newTask = {
        id: tasks.length+1,
        title: title.trim(),
        priority: normalizePriority
    };

    tasks.push(newTask);

    res.status(201).json({
        message: "Task created successfully",
        task: req.body
    });
});

app.patch("/api/v1/tasks/:id", (req, res) => {
    const taskId = Number(req.params.id);

    if(Number.isNaN(taskId)){
        return res.status(400).json({
            message: "Task Id is not valid"
        });
    }

    const task = tasks.find(task => taskId===task.id);

    if(!task){
        return res.status(404).json({
            message: "Task not found"
        });
    }

    const {title, priority} = req.body;

    if(title !== undefined){
        task.title = title;
    }
    if(priority !== undefined){
        if(!allowedPriority.includes(priority)){
            return res.status(400).json({
                message : "Priority values must be low, medium, high"
            });
        }
        task.priority = priority;
    }

    return res.status(200).json({
        message: "task updated successfully",
        task
    });

});

app.delete("/api/v1/tasks/:id", (req, res) => {
    const taskId = Number(req.params.id);

    if(Number.isNaN(taskId)){
        return res.status(400).json({
            message: "Task Id is not valid"
        });
    }

    const taskIndex = tasks.findIndex(task => task.id===taskId);

    if(taskIndex === -1){
        return res.status(404).json({
            message: "Task is not found"
        });
    }

    tasks.splice(taskIndex,1);

    return res.status(204).send();


});

app.listen(PORT, () => {
    console.log(`server is running on Port ${PORT}`);
});