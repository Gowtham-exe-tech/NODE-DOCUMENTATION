// const fs = require("fs");
// const data = fs.readFileSync("complexData.csv", "utf8");
// const rows = data.split("\n");
// const filtered = rows.filter(row => row.includes("PAID"));
// fs.writeFileSync("output.txt", filtered.join("\n"));

// ----------------------------------------------------------------------------------------
//EVENT LOOP DEMO:
// ----------------------------------------------------------------------------------------

// const fs = require('fs');

// //  Timers Phase
// setTimeout(() => console.log("Timer1: settimeout"), 0);

// //  Poll Phase & Check Phase
// fs.readFile(__filename, () => {
//     console.log("File read completed I/O");

//     // Scheduled inside an I/O callback
//     setTimeout( () => console.log("Timer2: Inside I/O"), 0);
//     setImmediate( () => console.log("SetImmediate Inside I/O"));
// });

// // Microtasks (Executed between phases/tasks)
// process.nextTick(() => console.log("MicroTsk: process.nextTick"));
// Promise.resolve().then(() => console.log("Microtask: promise.then"));


// console.log('Synchronous: Main Script End');

// --------------------------------------------------------------------------------------
//CALLBACK HELL
// --------------------------------------------------------------------------------------

// A function simulating placing an order
// function placeOrder(callback) {
//   setTimeout(() => {
//     console.log("1. Order Placed 📝");
//     callback(); // Moving to the next step
//   }, 1000);
// }

// function cookFood(callback) {
//   setTimeout(() => {
//     console.log("2. Food Cooked 🍔");
//     callback(); // Moving to the next step
//   }, 1000);
// }

// function packageMeal() {
//   setTimeout(() => {
//     console.log("3. Meal Packaged! 📦");
//   }, 1000);
// }

// // Running the workflow:
// placeOrder(() => {
//   cookFood(() => {
//     packageMeal();
//   });
// });

// -----------------------------
// PROMISE WAY
// -----------------------------

// We wrap our steps in a Promise object
// const placeOrder = () => new Promise(resolve => setTimeout(() => resolve("1. Order Placed 📝"), 1000));
// const cookFood = () => new Promise(resolve => setTimeout(() => resolve("2. Food Cooked 🍔"), 1000));
// const packageMeal = () => new Promise(resolve => setTimeout(() => resolve("3. Meal Packaged! 📦"), 1000));

// // Running the workflow cleanly from top to bottom:
// placeOrder()
//   .then(result1 => {
//     console.log(result1);
//     return cookFood(); // Move to next promise
//   })
//   .then(result2 => {
//     console.log(result2);
//     return packageMeal(); // Move to next promise
//   })
//   .then(result3 => {
//     console.log(result3);
//   });

// ------------------------------------------------------------------------------------------------------------------
//ASYNC/AWAIT
// ------------------------------------------------------------------------------------------------------------------

// const placeOrder = () => new Promise(resolve => setTimeout(() => resolve("1. Order Placed 📝"), 1000));
// const cookFood = () => new Promise(resolve => setTimeout(() => resolve("2. Food Cooked 🍔"), 1000));
// const packageMeal = () => new Promise(resolve => setTimeout(() => resolve("3. Meal Packaged! 📦"), 1000));

// async function getMyLunch() {
//   // JavaScript waits 1 second here
//   const step1 = await placeOrder(); 
//   console.log(step1);

//   // JavaScript waits another 1 second here
//   const step2 = await cookFood(); 
//   console.log(step2);

//   // JavaScript waits a final 1 second here
//   const step3 = await packageMeal(); 
//   console.log(step3);

//   console.log("Done! Enjoy your meal. 🎉");
// }

// getMyLunch();

// ------------------------------------------------------------------------------------------------------------------
// Event emitter
// ------------------------------------------------------------------------------------------------------------------

// const EventEmitter = require("events");

// const smartHome = new EventEmitter();

// // Listerners
// smartHome.on("person", (personName) => console.log(`ligths on ${personName}`));
// smartHome.on("person", () => console.log("ac on"));

// // Trigger events
// smartHome.emit("person", "John");

// ------------------------------------------------------------------------------------------------------------------
// Event emitter on http server
// ------------------------------------------------------------------------------------------------------------------

//normal http server creation

// const http = require("http");

// const server = http.createServer( (req, res) => {
//     res.end("server running......")
// });

// server.listen(3000);

// ------------------------------------------------------------------------------------------------------------------
//without createSever
// ------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------
//without createSever
// ------------------------------------------------------------------------------------------------------------------

// const http = require('http');

// // 1. Create a blank server object (an Event Emitter)
// const server = http.createServer();

// // 2. Explicitly listen for the 'request' event!
// server.on('request', (req, res) => {
    //     console.log(`Received an incoming request for: ${req.url}`);
    //     res.writeHead(200, { 'Content-Type': 'text/plain' });
    //     res.end('Event Emitter server...........!');
    // });
    
    // // 3. Listen for the 'listening' event (Fires when the server boots up)
    // server.on('listening', () => {
        //     console.log('Server is running on port 5000!');
        // });
        
        // // 4. Listen for network errors (like port already in use)
        // server.on('error', (err) => {
            //     console.error('Network server error:', err.message);
            // });
            
            // // Start the server
            // server.listen(5000);
            
// ------------------------------------------------------------------------------------------------------------------
//Stream
// ------------------------------------------------------------------------------------------------------------------



// creating a server using http module

// const http = require("http");

// const Server = http.createServer(req, res, ()=>{
//     console.log("Server ended.....")
// });

// Server.listen(3000);


// ------------------------------------------------------------------------------------------------------------------
//logic check
// ------------------------------------------------------------------------------------------------------------------
// const priority = "lpow";
// const allowedPriority = ["low", "medium", "high"];

//     if(!allowedPriority.includes(priority.toLowerCase())){
//         console.log(`fasle`);
//     }else {
//         console.log(`trse`)
//     }

const tasks = [
    {
        id: 1,
        title: "Fix payment API",
        priority: "high"
    },
    {
        id: 2,
        title: "Update dashboard",
        priority: "medium"
    }
];

const taskId = 1;
const taskIndex = tasks.findIndex(task => task.id === taskId);
console.log(taskIndex);