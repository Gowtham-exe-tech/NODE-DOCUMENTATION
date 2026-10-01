# Node.js

* developed by **Ryan Dahl** in **2009**.

* Initally created to make easier to build applications that handle large no of concurrent network connections without creating a separate thread for every connection.

* Particularly focused on to address I/O heavy, highly concurrent applications.
    1.Request
    2.Start I/O
    3.Don't wait
    4.Handle another request
    5.I/O completes
    6.Callback / Promise becomes ready
    7.JavaScript handles result

* A open source, cross-platform js runtime environment, allows to run js outside the browser.

* Js is not originally designed to create a http server, access database like that.

* It is **runtime environment for js** build around V8 Engine.
    - runtime environment means: provide everything required to execute a  program.

## Event-driven Architecture 

* Something happened -> run the code that is responsible for tht event

## Non-blocking 

* start a slow operation -> don't make the main js thread wait for it to finish.

* example: 

```js
app.post("/orders", async (req, res) => {
    const product = await getProduct(req.body.productId);

    const order = await createOrder({
        productId: product.id,
        userId: req.user.id
    });

    res.json(order);
});
```

* Here, await pauses this particular asynchronous function's continuation while the operation is pending.
* It does not mean the Node.js JavaScript thread sits there doing nothing and refuses to handle other requests.

**One waiter in Restaurant**

* one waiter is picks up one order from customer1 then send to kitchen, if he waits there untill the order is prepared, **customer2,3,4 will be waiting (blocking)**

* If he send order, then kitchen process the order, waiter goes to take another order **(non-blocking)**, so no one blocked.

* when the kitchen complete the order **(event)**, they notify the waiter to pick up it, here one event completed then notifies then the order is served **i.event happens then the handler called** => **Event driven**

*Kitchen completed order -> Event -> Waiter handles it -> Give biryani to Customer1*

**Note: Node.js does wait when your code performs synchronous/blocking work.**

## Applications we can build with node.js

1. REST API
2. BACKEND APPLICATIONS
3. REAL-TIME APPLICATIONS - chat, tracking systems
4. STREAMING APPLICATIONS
5. COMMAND LINE APPLICATIONS
6. MICROSERVICES

## Where not primarily designed for:

* Heavy CPU-boud calculations
ex: 10 billion mathematical calculations

    if i execute them synchronously on mian js thread:

    ```js
    function calculate() {
    for (let i = 0; i < 10_000_000_000; i++) {
        // heavy computation
        }
    }
    ```
    Event loop gets blocked, so other requests have to wait.

* I/O bound: Application spends most time waiting for external operations(node works)

* CPU-BOUND: Application spends significant time actively computing like...
- Large mathematical simulations
- Complex scientific calculations
- Heavy image processing
- Large video encoding
- Machine-learning model computation

*note: it can handle cpu-heavy workloads using additional execution resources like worker threads, cluster, but we should avoid it as it could block event-loop responsiveness.

# V8 Engine

* V8 is Google's open-source JavaScript engine that parses, compiles, and executes JavaScript code. Node.js uses V8 as its JavaScript execution engine.

* Work is to execute js code.

* single thread execution, holds the node.js main thread.

* Process:
    - Prases the js code(Abstract Syntax Tree-AST)
    - Converts it into internal representation/bytecode.
    - Executes it (Ignitor/Interpretator)
    - Optimizes frequently executed code (JIT Compilation)
    - If changes in hot function deoptimizes it
    - manages Js memory and garbage collection

# libuv (Library Unicorn Velociraptor) 

* It is a cross-platform C library used by Node.js to provide its event loop and asynchronous I/O infrastructure, including mechanisms for networking, filesystem operations, timers, and a thread pool for certain operations.

* libuv helps Node.js handle work that should happen outside the main JavaScript execution flow.
    - Event loop
    - Asynchronous I/O handling
    - Networking
    - Timers
    - Thread pool

```js
const fs = require("fs");

fs.readFile("users.json", "utf8", (err, data) => {
    console.log(data);
});

console.log("Request processing continues...");
```
                  Your JavaScript
                        ↓
                       V8
                "Execute this code"
                        ↓
                 Node.js fs API
                "Read this file"
                        ↓
                libuv / OS facilities
                "Handle the I/O"
                        ↓
                 File operation
                        ↓
                  Operation done
                        ↓
                  Event loop
                "Callback is ready"
                        ↓
                       V8
                "Execute callback"
                
1. node app.js
2. Node.js starts the application
3. V8 starts executing JavaScript
4. V8 executes fs.readFile()
5. Node.js fs API receives the request
6. Async filesystem work is started
7. JavaScript does NOT wait for the file
8. V8 executes console.log()
9. "Request processing continues..."
10. File reading continues asynchronously
11. File operation completes
12. Result becomes ready
13. Event loop coordinates the callback
14. V8 executes the callback
15. console.log(data)
16. File contents are printed

# Processing Flow

* **The Event Loop (Main Thread):** All your synchronous application logic, calculations, and event handlers run on a single main thread. This eliminates complex multi-threading problems like race conditions and deadlocks

* **The libuv Worker Pool (Thread Pool):** When your application triggers a heavy, potentially blocking operation (such as disk I/O, cryptography tasks like hashing, compression, or DNS lookups), the Event Loop does not wait around. It delegates that work entirely to libuv's internal background worker pool (which defaults to 4 threads, but is configurable)

* **The Non-Blocking Callback:** Once a background worker or the OS finishes the delegated task, it alerts libuv. libuv then pushes the associated callback function into a queue. When the Event Loop finishes its current execution cycle, it picks up the callback from the queue and runs it on the main thread

# Event Loop

* The core continuous loop inside libuv that coordinates asynchronous operations in Node.js by cycling through a series of distinct phases to execute callbacks without blocking the main execution thread.

* Each phase of event loop maintains FIFO queue of callbacks to execute.
*Example: like a train that stops at specific stations in a strict order, at each station, it process a specific type of task before move to next.

```js
const fs = require('fs');

//  Timers Phase
setTimeout(() => console.log("Timer1: settimeout"), 0);

//  Poll Phase & Check Phase
fs.readFile(__filename, () => {
    console.log("File read completed I/O");

    // Scheduled inside an I/O callback
    setTimeout( () => console.log("Timer2: Inside I/O"), 0);
    setImmediate( () => console.log("SetImmediate Inside I/O"));
});

// Microtasks (Executed between phases/tasks)
process.nextTick(() => console.log("MicroTsk: process.nextTick"));
Promise.resolve().then(() => console.log("Microtask: promise.then"));


console.log('Synchronous: Main Script End');

// output
// Synchronous: Main Script End
// MicroTsk: process.nextTick
// Microtask: promise.then
// Timer1: settimeout
// File read completed I/O
// SetImmediate Inside I/O
// Timer2: Inside I/O
```

* Before the event loop even starts, the Synchronous Main Script runs completely.
Immediate Output:  Synchronous: Main Script End

* Next, the Microtask Queues fire immediately before the loop enters Phase 1.
Microtask Output: Microtask: process.nextTick followed by  Microtask: Promise.then

* Now, the event loop begins cycling through its six phases:
**Phase 1: Timers**
• What happens: The loop checks if the clock has passed the threshold for any scheduled setTimeout or setInterval arrays.
• In our example: Timer 1 (0ms) is ready. The loop runs its callback.
• Output: Timer 1: setTimeout

**Phase 2: Pending Callbacks**
• What happens: This phase executes system-level I/O callbacks that were deferred or reported errors during the previous loop cycle (e.g., a TCP socket connection error).
• In our example: There are no pending system errors or deferred TCP operations, so the loop moves past this instantly.

**Phase 3: Idle, Prepare**
• What happens: This is a purely internal phase used exclusively by Node.js to prepare its own environment and subsystems.
• In our example: No developer code ever executes here. The loop passes right through.

**Phase 4: Poll**
• What happens: The loop looks for new I/O events. It reads data from the network, disk, or databases. If file operations finish, their callbacks execute here.
• In our example: The hard drive finishes reading the file (fs.readFile). The loop stops here and executes the callback.
• Output: I/O 1: File Read Completed
• Crucial note: Inside this callback, we schedule Timer 2 and Check 1. Because the queue is now empty and a setImmediate exists, the loop is forced to exit the Poll phase and advance forward.

**Phase 5: Check**
• What happens: This phase is specifically reserved for setImmediate() callbacks. It allows developers to execute a piece of code right after the I/O operations finish.
• In our example: The loop enters the Check phase and immediately runs Check 1.
• Output: Check 1: setImmediate Inside I/O

**Phase 6: Close Callbacks**
• What happens: If a socket or a stream is abruptly closed (e.g., socket.destroy()), their cleanup event callbacks (like socket.on('close', ...)) are executed here.
• In our example: No resources are closing, so the loop completes its first full lap (tick).

**The Final Lap(Tick 2)**
The event loop loops back to Phase 1 (Timers) for its second iteration. It finds Timer 2 (which was scheduled during the Poll phase of the previous tick) and executes it.
• Final Output: Timer 2: Inside I/O

# Thred Pool

* A collection of background worker threads provided by the libuv C library. 
* While the main thread processes JavaScript sequentially via the Event Loop, the Thread Pool handles tasks that are synchronous and computationally expensive or unmanageable by the OS's native asynchronous system kernels.

* Node.js automatically offloads specific operations to libuv thrad pool.

    - *File System (fs module)*: Heavy disk operations like `fs.readFile`, `fs.writeFile`, and `fs.readdir`.
    -  *Cryptography (crypto module)*: CPU-intensive mathematical functions like `crypto.pbkdf2()`, `crypto.scrypt()`, `crypto.randomBytes()`, and cipher generation.
    - *Compression (zlib module)* : Data compression and decompression actions such as `zlib.gzip()`, `zlib.deflate()`, or `zlib.unzip()`.
    - *DNS Resolution (dns module)*: The `dns.lookup()` method uses the thread pool because resolving a domain name depends on blocking system configuration files (/etc/hosts) and network protocols

## Thread Pool Size Limits & Bottlenecks
By default, the libuv thread pool contains only 4 threads.

If your application triggers five heavy operations at the exact same moment (e.g., hashing 5 passwords simultaneously using crypto.pbkdf2), the thread pool becomes a temporary bottleneck:

1. Threads 1, 2, 3, and 4 immediately claim the first 4 hashing tasks.
2. The 5th task must wait in a queue.
3. Only when one of the first four threads completes its task and returns its callback to the Event Loop can the 5th task begin processing.

## Modifying Thread Pool Performance
You can change the default thread pool capacity by setting the environment variable `UV_THREADPOOL_SIZE` at the very launch of your application.

**How to configure it:**
• Linux/macOS: `UV_THREADPOOL_SIZE=64 node server.js`
• Windows (CMD): `set UV_THREADPOOL_SIZE=64 && node server.js`
• Windows (PowerShell): `$env:UV_THREADPOOL_SIZE=64; node server.js`

**Rules for tuning size:**
• The maximum supported size limit is 1024 threads.
• The optimal size depends directly on your system hardware capacity and workload.

## A simple example 

In a busy restaurant kitchen:

* **The Main Thread is the Head Chef**. They take orders, plate the food, and orchestrate the kitchen. They only do one thing at a time.

* **The libuv Thread Pool is like the Kitchen** (the dishwasher, the automated oven, the blender). The Head Chef puts dirty dishes in the dishwasher, presses "Start," and immediately goes back to cooking. The appliance handles the work in the background without wasting the chef's time.

* **Worker Threads are like hiring Assistant Chefs**. If the Head Chef gets a massive order that requires chopping 50 kilograms of onions (a massive CPU-heavy JavaScript task), doing it themselves would grind the whole kitchen to a halt. Instead, they hire an Assistant Chef (a Worker Thread) who has their own cutting board and knife to chop the onions in parallel.

```js
// main.js
const { Worker } = require('worker_threads');

console.log("1. Server is live and taking requests...");

// Spawn a worker thread to do heavy math in the background
const worker = new Worker('./heavy-math.js');

worker.on('message', (result) => {
  console.log(`3. Calculation finished: ${result}`);
});

console.log("2. Main thread is still free to handle other users!");

// heavy-math.js (Runs on a separate V8 engine instance)
const { parentPort } = require('worker_threads');

let total = 0;
// A massive loop that would normally freeze a single thread
for (let i = 0; i < 1000000000; i++) {
  total += i;
}

// Send the final result back to the main thread
parentPort.postMessage(total);
```

# Callback Hell(Pyramid of Doom)

* with callbacks, i have to pass a function inside another function to say "when you are done with this step, move to next"

* *To know concept:* **ordering  meal at fast-food restaurant**
    To get meal, three things must happen in a strict order:
        1. 📝 Place your order ( 1 sec)
        2. 🍔 Cook the food (1 sec)
        3. 📦 Package the meal (1 sec)

```js
// A function simulating placing an order
function placeOrder(callback) {
  setTimeout(() => {
    console.log("1. Order Placed 📝");
    callback(); // Moving to the next step
  }, 1000);
}

function cookFood(callback) {
  setTimeout(() => {
    console.log("2. Food Cooked 🍔");
    callback(); // Moving to the next step
  }, 1000);
}

function packageMeal() {
  setTimeout(() => {
    console.log("3. Meal Packaged! 📦");
  }, 1000);
}

// Running the workflow:Pyramid shape formed 
placeOrder(() => {
  cookFood(() => {
    packageMeal();
  });
});
```
## Callback issuses
* **Inversion of Control(trust issues)**
    * When you use a callback, you are taking a piece of your code and handing it over to another function, saying: "Here, take my callback and run it when you are finished."
    * If that function belongs to a **third-party library** (like an external payment gateway or analytics tracker), you lose total control over your application's execution:
        - What if the library calls your callback two times by mistake? (e.g., charging a customer's credit card twice).
        - What if the library never calls your callback? Your application freezes forever, and you have no clean way to know.
    * **The Solution:** Promises solve this completely. A Promise is a token returned to you. It can only turn from "Pending" to "Successful" (or "Failed") exactly once. It cannot change state again, *protecting your code from running multiple times or hanging indefinitely.*
 
 * **Nightmare of Error Handling:**
 * applications fail all the time (e.g., network drops, database timeouts). In callback hell, you have to manually handle errors at every single layer.

 ```js
doStep1((err, result1) => {
    if (err) {
        console.error("Step 1 failed"); // Error check #1
        return; 
    }
    doStep2(result1, (err, result2) => {
        if (err) {
            console.error("Step 2 failed"); // Error check #2
            return;
        }
        doStep3(result2, (err, result3) => {
            if (err) {
                console.error("Step 3 failed"); // Error check #3
                return;
            }
            console.log("Success!");
        });
    });
});
```

* *The Solution:* With async/await, you wrap everything in a single, standard try/catch block. If step 1, 2, or 3 fails, execution stops immediately, and the code jumps directly to the catch block*

# Solve Callback hell

## Promise way(Linear chaining)

```js
// We wrap our steps in a Promise object
const placeOrder = () => new Promise(resolve => setTimeout(() => resolve("1. Order Placed 📝"), 1000));
const cookFood = () => new Promise(resolve => setTimeout(() => resolve("2. Food Cooked 🍔"), 1000));
const packageMeal = () => new Promise(resolve => setTimeout(() => resolve("3. Meal Packaged! 📦"), 1000));

// Running the workflow cleanly from top to bottom:
placeOrder()
  .then(result1 => {
    console.log(result1);
    return cookFood(); // Move to next promise
  })
  .then(result2 => {
    console.log(result2);
    return packageMeal(); // Move to next promise
  })
  .then(result3 => {
    console.log(result3);
  });
```

## Promise
* I went to coffee shop, i order coffee, they give me buzzer instead of coffee and tell me to wait, Now i have buzzer**(Promise)**, but i have the guranteee that i will get it**(Pending)**

* If everything goes right, the buzzer flashes. You hand it back and get your fresh coffee. This means the promise is Fulfilled **(Successful)**

* If they run out of milk, the buzzer beeps red, and you get a refund instead of coffee. This means the promise is Rejected **(Failed)**

• **Pending:** The asynchronous operation is still working in the background.

• **Fulfilled:** The operation finished successfully, and we have the data.

• **Rejected:** The operation failed due to an error, and we have an error message.

• `.then()`: Runs automatically when the promise moves to Fulfilled (Success). It receives the successful data.

• `.catch()`: Runs automatically when the promise moves to Rejected (Failure). It receives the error.

• `.finally()`: Runs at the very end, regardless of whether the promise succeeded or failed (perfect for cleanup tasks).


## ASYNC/AWAIT WAY

```js
// (Using the exact same Promises from the example above)
const placeOrder = () => new Promise(resolve => setTimeout(() => resolve("1. Order Placed 📝"), 1000));
const cookFood = () => new Promise(resolve => setTimeout(() => resolve("2. Food Cooked 🍔"), 1000));
const packageMeal = () => new Promise(resolve => setTimeout(() => resolve("3. Meal Packaged! 📦"), 1000));

async function getMyLunch() {
  // JavaScript waits 1 second here
  const step1 = await placeOrder(); 
  console.log(step1);

  // JavaScript waits another 1 second here
  const step2 = await cookFood(); 
  console.log(step2);

  // JavaScript waits a final 1 second here
  const step3 = await packageMeal(); 
  console.log(step3);
  
  console.log("Done! Enjoy your meal. 🎉");
}

getMyLunch();
```

* async/await is just a cleaner wrapper for this exact functionality. Instead of using .`then()` and `.catch()`

* `await` acts exactly like `.then()` — it extracts the value out of resolve()

* `try/catch` acts exactly like `.catch()` — it catches the value from reject()

# EventEmitter Pattern

* A central object that allows one part of code to **emit an event** and another part of code listen and react, **handle the event**

* ex: youtube channels (i subscribe the channel).
        - every time he upload the video in channel(publish) sends me notifcition.
        - I am subscriber, when i see notifications , i react to it.

* Two core functions:

• `.on(eventName, callback)` -> The Listener (Subscribing to the channel). This tells Node, "When you hear eventName happen, run this specific function."

• `.emit(eventName, data)` -> The Publisher (Uploading the video). This triggers the event and sends out any relevant data to anyone listening.

```js
// 1. Import the built-in 'events' module
const EventEmitter = require('events');

// 2. Create an instance of the Event Emitter
const smartHouse = new EventEmitter();

// 3. SET UP THE LISTENERS (.on)
// The Light system is listening for someone to walk in
smartHouse.on('personEntered', (name) => {
    console.log(`💡 Light System: Turning on the hallway lights for ${name}.`);
});

// The AC system is ALSO listening for the exact same event
smartHouse.on('personEntered', (name) => {
    console.log(`❄️  AC System: Setting the temperature to a comfortable 22°C for ${name}.`);
});

// A different event for security emergencies
smartHouse.on('emergency', (message) => {
    console.log(`🚨 SECURITY ALERT: ${message}!!!`);
});


// 4. TRIGGER THE EVENTS (.emit)
// We shout out the event 'personEntered' and pass the data 'John'
smartHouse.emit('personEntered', 'John');

// An emergency happens
smartHouse.emit('emergency', 'Window broken in the kitchen');
```

* order matters first define listener then then trigger the event.

* multiple listerners can get trigger by same event, executed in order in how they defined.

* Synchronous Execution , when trigger it calls all listner functions in main thread.

## example http server creation

```js
const http = require("http");

const server = http.createServer( (req, res) => {
    res.end("server running......")
});

server.listen(3000);
```

here, server object returned by `http.createServer` is a direct instance of Node's native `net.Server`, which directly extends the EventEmitter class.

The callback function pass inside `http.createServer((req, res) => { ... })` is actually just an event listener automatically attached to an event named `'request'`.

# STREAMS

* If I had to download an entire 4GB movie before I could start watching it, we would have to sit and wait for 20 minutes. computer would also need to hold all 4GB of that file in its RAM (memory) at once.

* Netflix uses a Stream. It breaks the movie up into tiny, 5-megabyte chunks. It sends you Chunk 1, browser plays it, throws it away, and immediately asks for Chunk 2. Because of this:
    1. You can watch the movie instantly.
    2. Your computer only uses 5MB of memory at any given moment, instead of 4GB.

* In Node.js, a Stream is exactly that—a mechanism to process data (files, network traffic, database inputs) piece by piece (chunk by chunk) instead of reading it all into memory at once.

## Types of Streams

• **Readable Streams:** Data that you can read from (e.g., reading a file via fs.createReadStream or an incoming HTTP request req).

• **Writable Streams:** Data containers you can write to (e.g., writing a file via fs.createWriteStream or sending an HTTP response back to a browser res).

• **Duplex Streams:** A stream that is both Readable and Writable at the same time (e.g., a network socket connection where you can both send and receive data).

• **Transform Streams:** A special type of Duplex stream that modifies or transforms the data as it is being read or written (e.g., compressing a file into a .zip layout on the fly).

# Module 2: Express.js Routing & HTTP Architecture

## Initializing an Express application and configuring environmental constants with dotenv

* Express.js is a web framework built on top of Node.js HTTP capabilities.
* In raw Node.js, we manually work with `http.createServer()`, inspect `req.method`, inspect `req.url`, parse request bodies, and decide how to route requests.
* Express gives us a structured way to handle these responsibilities:
  * routing
  * request parsing
  * middleware
  * response handling
  * error handling
  * API organization

* Real-world analogy:
  * Raw Node.js is like managing an entire hotel reception manually.
  * You receive the guest, identify what they need, check their request, find the correct department, and respond.
  * Express is like having a proper hotel reception system:
    * routes decide which department handles the request
    * middleware performs common checks
    * controllers perform business operations
    * responses are standardized

* Basic project setup:

```bash
mkdir module2-express
cd module2-express
npm init -y
npm install express dotenv
```

* A basic Express application:

```js
const express = require("express");

const app = express();

app.get("/", (req, res) => {
    res.json({
        message: "API is running"
    });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
```

* `express()` creates an Express application object.
* `app.get()` registers a route for HTTP GET requests.
* `req` contains information about the incoming request.
* `res` is used to send a response to the client.
* `res.json()` sends a JSON response.
* `app.listen()` starts the HTTP server.

* In a real application, do not hardcode values such as ports, database URLs, API keys, or JWT secrets directly in source code.

* Example of a bad approach:

```js
const port = 3000;
const databaseUrl = "mongodb://localhost:27017/company";
```

* The problem is that different environments normally need different values:
  * local development
  * testing
  * staging
  * production

* `dotenv` loads environment variables from a `.env` file into `process.env`.

* Example `.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/company
JWT_SECRET=my-secret-key
```

* Load dotenv before accessing the variables:

```js
require("dotenv").config();

const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.json({
        message: "API is running",
        environment: process.env.NODE_ENV
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

* Real-world analogy:
  * `.env` is like a private configuration sheet given to each branch of a company.
  * The application code is the same in every branch.
  * Each branch can have different configuration values.
  * You do not rewrite the company's operating procedure just because the database address changed.

* Important:
  * Never commit `.env` when it contains secrets.
  * Add `.env` to `.gitignore`.
  * Commit a `.env.example` containing only the required variable names.

```gitignore
node_modules/
.env
```

```env
PORT=
NODE_ENV=
DATABASE_URL=
JWT_SECRET=
```

* A better production structure separates configuration from application startup:

```text
src/
    config/
        env.js
    routes/
    controllers/
    app.js
    server.js
.env
.env.example
.gitignore
package.json
```

* `src/config/env.js`:

```js
require("dotenv").config();

module.exports = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    databaseUrl: process.env.DATABASE_URL
};
```

* `src/app.js`:

```js
const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "API is running"
    });
});

module.exports = app;
```

* `src/server.js`:

```js
const app = require("./app");
const config = require("./config/env");

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});
```

* This separation is useful because:
  * `app.js` creates/configures the application.
  * `server.js` starts the network server.
  * `env.js` manages environment configuration.
  * tests can import `app` without automatically opening a server port.

## HTTP request methods and semantic status codes

* HTTP methods describe what the client wants to do with a resource.
* A REST API commonly uses:
  * `GET` → retrieve data
  * `POST` → create a resource or trigger an operation
  * `PUT` → replace an existing resource
  * `PATCH` → partially update an existing resource
  * `DELETE` → remove a resource

* Real-world analogy:
  * Imagine a company employee management system.
  * `GET /api/v1/employees` means "show me the employees."
  * `POST /api/v1/employees` means "create a new employee."
  * `PUT /api/v1/employees/101` means "replace employee 101's complete record."
  * `PATCH /api/v1/employees/101` means "change only part of employee 101's record."
  * `DELETE /api/v1/employees/101` means "remove employee 101."

* `GET` example:

```js
app.get("/api/v1/users", (req, res) => {
    res.status(200).json({
        users: []
    });
});
```

* `POST` example:

```js
app.post("/api/v1/users", (req, res) => {
    const user = req.body;

    res.status(201).json({
        message: "User created",
        user
    });
});
```

* `PUT` example:

```js
app.put("/api/v1/users/:id", (req, res) => {
    const { id } = req.params;

    res.status(200).json({
        message: `User ${id} replaced`,
        user: req.body
    });
});
```

* `PATCH` example:

```js
app.patch("/api/v1/users/:id", (req, res) => {
    const { id } = req.params;

    res.status(200).json({
        message: `User ${id} partially updated`,
        changes: req.body
    });
});
```

* `DELETE` example:

```js
app.delete("/api/v1/users/:id", (req, res) => {
    const { id } = req.params;

    res.status(204).send();
});
```

* `PUT` and `PATCH` are not interchangeable:
  * `PUT` generally represents replacement of the resource representation.
  * `PATCH` represents partial modification.
  * If a user has `{ name, email, phone }`, a PATCH containing only `{ phone }` means only the phone needs to change.
  * A PUT request may be designed to provide the complete representation.

* Status codes communicate what happened with the request.

* Common `2xx` success codes:
  * `200 OK` → request succeeded and a response body is normally returned.
  * `201 Created` → a new resource was successfully created.
  * `202 Accepted` → request was accepted for processing, but processing may happen later.
  * `204 No Content` → request succeeded and there is no response body.

* Common `4xx` client-side error codes:
  * `400 Bad Request` → request is malformed or invalid.
  * `401 Unauthorized` → authentication is required or authentication failed.
  * `403 Forbidden` → the server understood the request but refuses to authorize it.
  * `404 Not Found` → requested resource does not exist.
  * `409 Conflict` → request conflicts with the current resource state.
  * `422 Unprocessable Content` → request structure is understandable, but validation failed.

* Common `5xx` server-side error codes:
  * `500 Internal Server Error` → unexpected server-side failure.
  * `502 Bad Gateway` → a gateway/proxy received an invalid response from an upstream server.
  * `503 Service Unavailable` → service is temporarily unable to handle the request.

* Do not return `200` for every situation.

* Bad API behavior:

```js
app.get("/api/v1/users/:id", (req, res) => {
    const user = findUser(req.params.id);

    if (!user) {
        return res.status(200).json({
            message: "User not found"
        });
    }

    res.status(200).json(user);
});
```

* The client sees `200`, which means the HTTP request succeeded. It now has to inspect the response body to understand that the requested resource was not found.
* Better:

```js
app.get("/api/v1/users/:id", (req, res) => {
    const user = findUser(req.params.id);

    if (!user) {
        return res.status(404).json({
            error: "User not found"
        });
    }

    res.status(200).json(user);
});
```

* Status codes are part of the API contract.
* Frontend applications, mobile apps, API gateways, monitoring systems, and other services can use them to determine what happened without guessing from arbitrary response text.

## Deconstructing incoming data with req.params, req.query, and express.json()

* An HTTP request can carry information in different places.
* The three important places for this module are:
  * URL path parameters → `req.params`
  * query string parameters → `req.query`
  * request body → `req.body`

* Think of an API request as a delivery:
  * `req.params` tells the delivery person exactly which resource/address is being targeted.
  * `req.query` gives optional instructions for how to search/filter/sort the request.
  * `req.body` contains the actual information being submitted.

* `req.params` is used for values embedded inside the URL path.

```js
app.get("/api/v1/users/:id", (req, res) => {
    console.log(req.params);
    console.log(req.params.id);

    res.json({
        userId: req.params.id
    });
});
```

* Request:

```text
GET /api/v1/users/42
```

* `req.params` becomes:

```js
{
    id: "42"
}
```

* Multiple parameters are possible:

```js
app.get("/api/v1/companies/:companyId/users/:userId", (req, res) => {
    const { companyId, userId } = req.params;

    res.json({
        companyId,
        userId
    });
});
```

* Request:

```text
GET /api/v1/companies/10/users/42
```

* Use path parameters when the value identifies a specific resource.

* Good:

```text
GET /api/v1/users/42
GET /api/v1/products/1001
GET /api/v1/orders/500
```

* `req.query` reads values after `?` in the URL.

```js
app.get("/api/v1/users", (req, res) => {
    const { page, limit, search } = req.query;

    res.json({
        page,
        limit,
        search
    });
});
```

* Request:

```text
GET /api/v1/users?page=2&limit=20&search=gowtham
```

* `req.query` becomes approximately:

```js
{
    page: "2",
    limit: "20",
    search: "gowtham"
}
```

* Query values arrive as strings, so convert them when numeric behavior is required.

```js
const page = Number(req.query.page) || 1;
const limit = Number(req.query.limit) || 20;
```

* Query parameters are commonly used for:
  * filtering
  * searching
  * sorting
  * pagination
  * optional behavior

* Example production-style endpoint:

```js
app.get("/api/v1/products", (req, res) => {
    const {
        category,
        search,
        page = "1",
        limit = "20"
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    res.json({
        filters: {
            category,
            search
        },
        pagination: {
            page: pageNumber,
            limit: limitNumber
        }
    });
});
```

* `req.params` vs `req.query`:

```text
GET /api/v1/products/101
```

* `101` is part of the resource path, so it belongs to `req.params`.

```text
GET /api/v1/products?category=laptop&page=2
```

* `category` and `page` are optional search/listing instructions, so they belong to `req.query`.

* Request bodies are commonly used with `POST`, `PUT`, and `PATCH`.

* Express does not automatically parse JSON request bodies unless JSON parsing middleware is enabled.

```js
app.use(express.json());
```

* After this middleware is registered, JSON request bodies can be accessed through `req.body`.

* Example:

```js
app.use(express.json());

app.post("/api/v1/users", (req, res) => {
    const { name, email, age } = req.body;

    res.status(201).json({
        message: "User created",
        user: {
            name,
            email,
            age
        }
    });
});
```

* Client request:

```http
POST /api/v1/users
Content-Type: application/json
```

```json
{
    "name": "Gowtham",
    "email": "gowtham@example.com",
    "age": 21
}
```

* Without `express.json()`, `req.body` will not be populated for normal JSON payloads by Express's JSON parser.

* Middleware execution order matters.

```js
app.use(express.json());

app.post("/api/v1/users", (req, res) => {
    console.log(req.body);
    res.status(201).json(req.body);
});
```

* `express.json()` runs before the route handler.
* It reads the JSON request body.
* It parses the JSON.
* It makes the parsed object available as `req.body`.
* The route handler can then use it.

* Real production example:
  * A job application API might receive:

```json
{
    "name": "Gowtham",
    "email": "gowtham@example.com",
    "skills": ["JavaScript", "Node.js", "Express"]
}
```

* The route can then validate the payload before sending it to a service/database layer.

```js
app.post("/api/v1/applications", (req, res) => {
    const { name, email, skills } = req.body;

    if (!name || !email || !Array.isArray(skills)) {
        return res.status(400).json({
            error: "Invalid application data"
        });
    }

    res.status(201).json({
        message: "Application received"
    });
});
```

* Important security point:
  * `req.body` is client-controlled input.
  * Never assume it is trustworthy.
  * Validate required fields.
  * Validate data types.
  * Validate allowed values.
  * Apply size limits where appropriate.
  * Never directly trust values just because they came through your API.

* You can configure a JSON body size limit:

```js
app.use(express.json({
    limit: "1mb"
}));
```

* This is useful because clients should not be able to send arbitrarily large JSON payloads to an endpoint that expects a small request.

## Structuring routes with express.Router()

* As an application grows, putting every route inside `app.js` becomes difficult to maintain.

* Bad structure:

```js
const express = require("express");

const app = express();

app.get("/api/v1/users", ...);
app.get("/api/v1/users/:id", ...);
app.post("/api/v1/users", ...);
app.patch("/api/v1/users/:id", ...);
app.delete("/api/v1/users/:id", ...);

app.get("/api/v1/products", ...);
app.get("/api/v1/products/:id", ...);
app.post("/api/v1/products", ...);
app.patch("/api/v1/products/:id", ...);
app.delete("/api/v1/products/:id", ...);

app.get("/api/v1/orders", ...);
app.post("/api/v1/orders", ...);
```

* It may work technically, but the file becomes a large mixture of unrelated resources.

* `express.Router()` creates a modular routing system.

* Real-world analogy:
  * Imagine a company with departments.
  * The main reception does not personally handle HR, finance, sales, support, and engineering.
  * It sends the request to the correct department.
  * `app.js` acts like the main reception.
  * Each router acts like a department responsible for one resource.

* Example structure:

```text
src/
    app.js
    server.js
    config/
        env.js
    routes/
        user.routes.js
        product.routes.js
        order.routes.js
    controllers/
        user.controller.js
        product.controller.js
        order.controller.js
```

* User router:

```js
const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        message: "Get all users"
    });
});

router.get("/:id", (req, res) => {
    res.json({
        message: `Get user ${req.params.id}`
    });
});

router.post("/", (req, res) => {
    res.status(201).json({
        message: "Create user"
    });
});

router.patch("/:id", (req, res) => {
    res.json({
        message: `Update user ${req.params.id}`
    });
});

router.delete("/:id", (req, res) => {
    res.status(204).send();
});

module.exports = router;
```

* Product router:

```js
const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        message: "Get all products"
    });
});

router.get("/:id", (req, res) => {
    res.json({
        message: `Get product ${req.params.id}`
    });
});

router.post("/", (req, res) => {
    res.status(201).json({
        message: "Create product"
    });
});

module.exports = router;
```

* Mount the routers in `app.js`:

```js
const express = require("express");

const userRouter = require("./routes/user.routes");
const productRouter = require("./routes/product.routes");

const app = express();

app.use(express.json());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);

module.exports = app;
```

* Notice how the router itself does not repeat `/api/v1/users`.

* Because of:

```js
app.use("/api/v1/users", userRouter);
```

* this router:

```js
router.get("/");
```

* becomes:

```text
GET /api/v1/users
```

* And:

```js
router.get("/:id");
```

* becomes:

```text
GET /api/v1/users/:id
```

* This is called mounting a router.

* A production-style API might look like:

```text
/api/v1/users
/api/v1/users/:id

/api/v1/products
/api/v1/products/:id

/api/v1/orders
/api/v1/orders/:id
```

* The `/api/v1` portion is commonly used for API versioning.
* Versioning allows a future API version to coexist with an older version.

* For example:

```text
/api/v1/users
/api/v2/users
```

* A breaking change can be introduced in `v2` while existing clients continue using `v1`.

* Keep resource names generally plural:

```text
/api/v1/users
/api/v1/products
/api/v1/orders
```

* Avoid action-heavy URLs when a normal HTTP method expresses the operation:

```text
POST /api/v1/users
```

* is usually preferable to:

```text
POST /api/v1/create-user
```

* Similarly:

```text
DELETE /api/v1/users/42
```

* expresses deletion through the HTTP method, so:

```text
POST /api/v1/delete-user/42
```

* is generally unnecessary for a conventional REST resource API.

* A clean module-level implementation can look like this:

```text
module2-express/
│
├── src/
│   ├── config/
│   │   └── env.js
│   │
│   ├── routes/
│   │   ├── user.routes.js
│   │   └── product.routes.js
│   │
│   ├── app.js
│   └── server.js
│
├── .env
├── .env.example
├── .gitignore
└── package.json
```

* `src/app.js`:

```js
const express = require("express");

const userRouter = require("./routes/user.routes");
const productRouter = require("./routes/product.routes");

const app = express();

app.use(express.json());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);

app.use((req, res) => {
    res.status(404).json({
        error: "Route not found"
    });
});

module.exports = app;
```

* `src/server.js`:

```js
const app = require("./app");
const config = require("./config/env");

app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
});
```

* The request flow now looks like:

```text
Client
  ↓
HTTP Request
  ↓
Express application
  ↓
express.json()
  ↓
Router matching
  ↓
Route handler
  ↓
Business logic
  ↓
Response
  ↓
Client
```

* In a larger application, the route handler should normally not contain all business logic.
* A common next step is:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Repository / Database
```

* For example:

```text
POST /api/v1/users
        ↓
user.routes.js
        ↓
user.controller.js
        ↓
user.service.js
        ↓
user.repository.js
        ↓
Database
```

* This separation keeps routing focused on HTTP concerns and allows business logic to be tested independently.

## Core mental model for Module 2

* `app` is the main Express application.
* `express.json()` parses JSON request bodies.
* `req.params` identifies values inside the URL path.
* `req.query` contains optional URL query parameters.
* `req.body` contains parsed request payload data.
* HTTP methods describe the intended operation.
* HTTP status codes communicate the result of the operation.
* `express.Router()` separates routes by resource/module.
* `app.use("/api/v1/users", userRouter)` mounts a router under a common path.
* `.env` stores environment-specific configuration.
* `process.env` provides access to environment variables.
* `dotenv` loads variables from `.env` during development.
* Route files should focus on routing; business logic should move into controllers/services as the application grows.

## Production-level request example

* Suppose a frontend wants to update only a user's phone number.

* Request:

```http
PATCH /api/v1/users/42
Content-Type: application/json
```

```json
{
    "phone": "+91-9876543210"
}
```

* Express receives the request.
* `express.json()` parses the JSON body.
* The router matches `/api/v1/users/:id`.
* `req.params.id` gives `"42"`.
* `req.body` gives `{ phone: "+91-9876543210" }`.
* The controller validates the input.
* The service performs the business operation.
* The repository/database layer updates the user.
* The API returns an appropriate status:

```http
200 OK
```

```json
{
    "id": 42,
    "phone": "+91-9876543210"
}
```

* If user `42` does not exist:

```http
404 Not Found
```

```json
{
    "error": "User not found"
}
```

* If the phone value is invalid:

```http
422 Unprocessable Content
```

```json
{
    "error": "Invalid phone number"
}
```

* The important idea is that HTTP itself carries meaning:
  * method → what operation is requested
  * URL → which resource is involved
  * query → optional filtering/instructions
  * body → submitted data
  * status code → what happened
  * JSON response → information the client can consume

## Common mistakes to avoid

* Hardcoding secrets or environment-specific configuration in JavaScript files.
* Committing `.env` to Git.
* Forgetting `app.use(express.json())` when accepting JSON request bodies.
* Treating every request as `POST`.
* Using `200 OK` for errors such as missing resources.
* Confusing `req.params` with `req.query`.
* Forgetting that query and path parameter values normally arrive as strings.
* Trusting `req.body` without validation.
* Putting every route in `app.js`.
* Mixing database/business logic directly into every route handler.
* Using `POST /create-user` when a resource-oriented `POST /users` is sufficient.
* Using `PUT` when the intended operation is only a partial update, without deliberately defining the API's PUT semantics.
* Forgetting to return after sending an early error response:

```js
if (!user) {
    return res.status(404).json({
        error: "User not found"
    });
}
```

* Returning two responses from the same request is an error:

```js
if (!user) {
    res.status(404).json({
        error: "User not found"
    });
}

res.json(user);
```

* The `return` prevents execution from continuing after the error response.

