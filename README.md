# Node.js

- developed by **Ryan Dahl** in **2009**.

- Initally created to make easier to build applications that handle large no of concurrent network connections without creating a separate thread for every connection.

- Particularly focused on to address I/O heavy, highly concurrent applications.
  1.Request
  2.Start I/O
  3.Don't wait
  4.Handle another request
  5.I/O completes
  6.Callback / Promise becomes ready
  7.JavaScript handles result

- A open source, cross-platform js runtime environment, allows to run js outside the browser.

- Js is not originally designed to create a http server, access database like that.

- It is **runtime environment for js** build around V8 Engine.
  - runtime environment means: provide everything required to execute a program.

## Event-driven Architecture

- Something happened -> run the code that is responsible for tht event

## Non-blocking

- start a slow operation -> don't make the main js thread wait for it to finish.

- example:

```js
app.post("/orders", async (req, res) => {
  const product = await getProduct(req.body.productId);

  const order = await createOrder({
    productId: product.id,
    userId: req.user.id,
  });

  res.json(order);
});
```

- Here, await pauses this particular asynchronous function's continuation while the operation is pending.
- It does not mean the Node.js JavaScript thread sits there doing nothing and refuses to handle other requests.

**One waiter in Restaurant**

- one waiter is picks up one order from customer1 then send to kitchen, if he waits there untill the order is prepared, **customer2,3,4 will be waiting (blocking)**

- If he send order, then kitchen process the order, waiter goes to take another order **(non-blocking)**, so no one blocked.

- when the kitchen complete the order **(event)**, they notify the waiter to pick up it, here one event completed then notifies then the order is served **i.event happens then the handler called** => **Event driven**

_Kitchen completed order -> Event -> Waiter handles it -> Give biryani to Customer1_

**Note: Node.js does wait when your code performs synchronous/blocking work.**

## Applications we can build with node.js

1. REST API
2. BACKEND APPLICATIONS
3. REAL-TIME APPLICATIONS - chat, tracking systems
4. STREAMING APPLICATIONS
5. COMMAND LINE APPLICATIONS
6. MICROSERVICES

## Where not primarily designed for:

- Heavy CPU-boud calculations
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

- I/O bound: Application spends most time waiting for external operations(node works)

- CPU-BOUND: Application spends significant time actively computing like...

* Large mathematical simulations
* Complex scientific calculations
* Heavy image processing
* Large video encoding
* Machine-learning model computation

\*note: it can handle cpu-heavy workloads using additional execution resources like worker threads, cluster, but we should avoid it as it could block event-loop responsiveness.

# V8 Engine

- V8 is Google's open-source JavaScript engine that parses, compiles, and executes JavaScript code. Node.js uses V8 as its JavaScript execution engine.

- Work is to execute js code.

- single thread execution, holds the node.js main thread.

- Process:
  - Prases the js code(Abstract Syntax Tree-AST)
  - Converts it into internal representation/bytecode.
  - Executes it (Ignitor/Interpretator)
  - Optimizes frequently executed code (JIT Compilation)
  - If changes in hot function deoptimizes it
  - manages Js memory and garbage collection

# libuv (Library Unicorn Velociraptor)

- It is a cross-platform C library used by Node.js to provide its event loop and asynchronous I/O infrastructure, including mechanisms for networking, filesystem operations, timers, and a thread pool for certain operations.

- libuv helps Node.js handle work that should happen outside the main JavaScript execution flow.
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

- **The Event Loop (Main Thread):** All your synchronous application logic, calculations, and event handlers run on a single main thread. This eliminates complex multi-threading problems like race conditions and deadlocks

- **The libuv Worker Pool (Thread Pool):** When your application triggers a heavy, potentially blocking operation (such as disk I/O, cryptography tasks like hashing, compression, or DNS lookups), the Event Loop does not wait around. It delegates that work entirely to libuv's internal background worker pool (which defaults to 4 threads, but is configurable)

- **The Non-Blocking Callback:** Once a background worker or the OS finishes the delegated task, it alerts libuv. libuv then pushes the associated callback function into a queue. When the Event Loop finishes its current execution cycle, it picks up the callback from the queue and runs it on the main thread

# Event Loop

- The core continuous loop inside libuv that coordinates asynchronous operations in Node.js by cycling through a series of distinct phases to execute callbacks without blocking the main execution thread.

- Each phase of event loop maintains FIFO queue of callbacks to execute.
  \*Example: like a train that stops at specific stations in a strict order, at each station, it process a specific type of task before move to next.

```js
const fs = require("fs");

//  Timers Phase
setTimeout(() => console.log("Timer1: settimeout"), 0);

//  Poll Phase & Check Phase
fs.readFile(__filename, () => {
  console.log("File read completed I/O");

  // Scheduled inside an I/O callback
  setTimeout(() => console.log("Timer2: Inside I/O"), 0);
  setImmediate(() => console.log("SetImmediate Inside I/O"));
});

// Microtasks (Executed between phases/tasks)
process.nextTick(() => console.log("MicroTsk: process.nextTick"));
Promise.resolve().then(() => console.log("Microtask: promise.then"));

console.log("Synchronous: Main Script End");

// output
// Synchronous: Main Script End
// MicroTsk: process.nextTick
// Microtask: promise.then
// Timer1: settimeout
// File read completed I/O
// SetImmediate Inside I/O
// Timer2: Inside I/O
```

- Before the event loop even starts, the Synchronous Main Script runs completely.
  Immediate Output: Synchronous: Main Script End

- Next, the Microtask Queues fire immediately before the loop enters Phase 1.
  Microtask Output: Microtask: process.nextTick followed by Microtask: Promise.then

- Now, the event loop begins cycling through its six phases:
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

- A collection of background worker threads provided by the libuv C library.
- While the main thread processes JavaScript sequentially via the Event Loop, the Thread Pool handles tasks that are synchronous and computationally expensive or unmanageable by the OS's native asynchronous system kernels.

- Node.js automatically offloads specific operations to libuv thrad pool.
  - _File System (fs module)_: Heavy disk operations like `fs.readFile`, `fs.writeFile`, and `fs.readdir`.
  - _Cryptography (crypto module)_: CPU-intensive mathematical functions like `crypto.pbkdf2()`, `crypto.scrypt()`, `crypto.randomBytes()`, and cipher generation.
  - _Compression (zlib module)_ : Data compression and decompression actions such as `zlib.gzip()`, `zlib.deflate()`, or `zlib.unzip()`.
  - _DNS Resolution (dns module)_: The `dns.lookup()` method uses the thread pool because resolving a domain name depends on blocking system configuration files (/etc/hosts) and network protocols

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

- **The Main Thread is the Head Chef**. They take orders, plate the food, and orchestrate the kitchen. They only do one thing at a time.

- **The libuv Thread Pool is like the Kitchen** (the dishwasher, the automated oven, the blender). The Head Chef puts dirty dishes in the dishwasher, presses "Start," and immediately goes back to cooking. The appliance handles the work in the background without wasting the chef's time.

- **Worker Threads are like hiring Assistant Chefs**. If the Head Chef gets a massive order that requires chopping 50 kilograms of onions (a massive CPU-heavy JavaScript task), doing it themselves would grind the whole kitchen to a halt. Instead, they hire an Assistant Chef (a Worker Thread) who has their own cutting board and knife to chop the onions in parallel.

```js
// main.js
const { Worker } = require("worker_threads");

console.log("1. Server is live and taking requests...");

// Spawn a worker thread to do heavy math in the background
const worker = new Worker("./heavy-math.js");

worker.on("message", (result) => {
  console.log(`3. Calculation finished: ${result}`);
});

console.log("2. Main thread is still free to handle other users!");

// heavy-math.js (Runs on a separate V8 engine instance)
const { parentPort } = require("worker_threads");

let total = 0;
// A massive loop that would normally freeze a single thread
for (let i = 0; i < 1000000000; i++) {
  total += i;
}

// Send the final result back to the main thread
parentPort.postMessage(total);
```

# Callback Hell(Pyramid of Doom)

- with callbacks, i have to pass a function inside another function to say "when you are done with this step, move to next"

- _To know concept:_ **ordering meal at fast-food restaurant**
  To get meal, three things must happen in a strict order: 1. 📝 Place your order ( 1 sec) 2. 🍔 Cook the food (1 sec) 3. 📦 Package the meal (1 sec)

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

- **Inversion of Control(trust issues)**
  - When you use a callback, you are taking a piece of your code and handing it over to another function, saying: "Here, take my callback and run it when you are finished."
  - If that function belongs to a **third-party library** (like an external payment gateway or analytics tracker), you lose total control over your application's execution:
    - What if the library calls your callback two times by mistake? (e.g., charging a customer's credit card twice).
    - What if the library never calls your callback? Your application freezes forever, and you have no clean way to know.
  - **The Solution:** Promises solve this completely. A Promise is a token returned to you. It can only turn from "Pending" to "Successful" (or "Failed") exactly once. It cannot change state again, _protecting your code from running multiple times or hanging indefinitely._

- **Nightmare of Error Handling:**
- applications fail all the time (e.g., network drops, database timeouts). In callback hell, you have to manually handle errors at every single layer.

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

- _The Solution:_ With async/await, you wrap everything in a single, standard try/catch block. If step 1, 2, or 3 fails, execution stops immediately, and the code jumps directly to the catch block\*

# Solve Callback hell

## Promise way(Linear chaining)

```js
// We wrap our steps in a Promise object
const placeOrder = () =>
  new Promise((resolve) =>
    setTimeout(() => resolve("1. Order Placed 📝"), 1000),
  );
const cookFood = () =>
  new Promise((resolve) =>
    setTimeout(() => resolve("2. Food Cooked 🍔"), 1000),
  );
const packageMeal = () =>
  new Promise((resolve) =>
    setTimeout(() => resolve("3. Meal Packaged! 📦"), 1000),
  );

// Running the workflow cleanly from top to bottom:
placeOrder()
  .then((result1) => {
    console.log(result1);
    return cookFood(); // Move to next promise
  })
  .then((result2) => {
    console.log(result2);
    return packageMeal(); // Move to next promise
  })
  .then((result3) => {
    console.log(result3);
  });
```

## Promise

- I went to coffee shop, i order coffee, they give me buzzer instead of coffee and tell me to wait, Now i have buzzer**(Promise)**, but i have the guranteee that i will get it**(Pending)**

- If everything goes right, the buzzer flashes. You hand it back and get your fresh coffee. This means the promise is Fulfilled **(Successful)**

- If they run out of milk, the buzzer beeps red, and you get a refund instead of coffee. This means the promise is Rejected **(Failed)**

• **Pending:** The asynchronous operation is still working in the background.

• **Fulfilled:** The operation finished successfully, and we have the data.

• **Rejected:** The operation failed due to an error, and we have an error message.

• `.then()`: Runs automatically when the promise moves to Fulfilled (Success). It receives the successful data.

• `.catch()`: Runs automatically when the promise moves to Rejected (Failure). It receives the error.

• `.finally()`: Runs at the very end, regardless of whether the promise succeeded or failed (perfect for cleanup tasks).

## ASYNC/AWAIT WAY

```js
// (Using the exact same Promises from the example above)
const placeOrder = () =>
  new Promise((resolve) =>
    setTimeout(() => resolve("1. Order Placed 📝"), 1000),
  );
const cookFood = () =>
  new Promise((resolve) =>
    setTimeout(() => resolve("2. Food Cooked 🍔"), 1000),
  );
const packageMeal = () =>
  new Promise((resolve) =>
    setTimeout(() => resolve("3. Meal Packaged! 📦"), 1000),
  );

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

- async/await is just a cleaner wrapper for this exact functionality. Instead of using .`then()` and `.catch()`

- `await` acts exactly like `.then()` — it extracts the value out of resolve()

- `try/catch` acts exactly like `.catch()` — it catches the value from reject()

# EventEmitter Pattern

- A central object that allows one part of code to **emit an event** and another part of code listen and react, **handle the event**

- ex: youtube channels (i subscribe the channel). - every time he upload the video in channel(publish) sends me notifcition. - I am subscriber, when i see notifications , i react to it.

- Two core functions:

• `.on(eventName, callback)` -> The Listener (Subscribing to the channel). This tells Node, "When you hear eventName happen, run this specific function."

• `.emit(eventName, data)` -> The Publisher (Uploading the video). This triggers the event and sends out any relevant data to anyone listening.

```js
// 1. Import the built-in 'events' module
const EventEmitter = require("events");

// 2. Create an instance of the Event Emitter
const smartHouse = new EventEmitter();

// 3. SET UP THE LISTENERS (.on)
// The Light system is listening for someone to walk in
smartHouse.on("personEntered", (name) => {
  console.log(`💡 Light System: Turning on the hallway lights for ${name}.`);
});

// The AC system is ALSO listening for the exact same event
smartHouse.on("personEntered", (name) => {
  console.log(
    `❄️  AC System: Setting the temperature to a comfortable 22°C for ${name}.`,
  );
});

// A different event for security emergencies
smartHouse.on("emergency", (message) => {
  console.log(`🚨 SECURITY ALERT: ${message}!!!`);
});

// 4. TRIGGER THE EVENTS (.emit)
// We shout out the event 'personEntered' and pass the data 'John'
smartHouse.emit("personEntered", "John");

// An emergency happens
smartHouse.emit("emergency", "Window broken in the kitchen");
```

- order matters first define listener then then trigger the event.

- multiple listerners can get trigger by same event, executed in order in how they defined.

- Synchronous Execution , when trigger it calls all listner functions in main thread.

## example http server creation

```js
const http = require("http");

const server = http.createServer((req, res) => {
  res.end("server running......");
});

server.listen(3000);
```

here, server object returned by `http.createServer` is a direct instance of Node's native `net.Server`, which directly extends the EventEmitter class.

The callback function pass inside `http.createServer((req, res) => { ... })` is actually just an event listener automatically attached to an event named `'request'`.

# STREAMS

- If I had to download an entire 4GB movie before I could start watching it, we would have to sit and wait for 20 minutes. computer would also need to hold all 4GB of that file in its RAM (memory) at once.

- Netflix uses a Stream. It breaks the movie up into tiny, 5-megabyte chunks. It sends you Chunk 1, browser plays it, throws it away, and immediately asks for Chunk 2. Because of this:
  1. You can watch the movie instantly.
  2. Your computer only uses 5MB of memory at any given moment, instead of 4GB.

- In Node.js, a Stream is exactly that—a mechanism to process data (files, network traffic, database inputs) piece by piece (chunk by chunk) instead of reading it all into memory at once.

## Types of Streams

• **Readable Streams:** Data that you can read from (e.g., reading a file via fs.createReadStream or an incoming HTTP request req).

• **Writable Streams:** Data containers you can write to (e.g., writing a file via fs.createWriteStream or sending an HTTP response back to a browser res).

• **Duplex Streams:** A stream that is both Readable and Writable at the same time (e.g., a network socket connection where you can both send and receive data).

• **Transform Streams:** A special type of Duplex stream that modifies or transforms the data as it is being read or written (e.g., compressing a file into a .zip layout on the fly).

# STREAM EXAMPLE

If I have a large CSV file containing **300,000 records**, I should not read the entire file into memory like this:

```js
const data = await fs.readFile("input/data.csv", "utf8");
```

This loads the complete file into memory before I can start processing it.

For a small file this is fine, but if the file is very large, memory usage can become a problem.

Instead, our POC uses **Streams**.

A Stream allows Node.js to process the file **piece by piece** instead of loading the entire file into memory at once.

For example:

        Large CSV File
            ↓
        Chunk 1
            ↓
        Process
            ↓
        Chunk 2
            ↓
        Process
            ↓
        Chunk 3
            ↓
        Process
            ↓
        ........


So Node.js does not need to keep the entire CSV file in RAM.

This is the main reason Streams are useful when working with large files, network data, or other continuously arriving data.

## Our CSV POC

In our POC, we have:

            input/data.csv
                ↓
            Readable Stream
                ↓
            Transform Stream
                ↓
            Filter PAID records
                ↓
            Writable Stream
                ↓
            output/filtered.txt


The important thing is that the whole CSV file does **not** need to be loaded into memory.

The data moves through the pipeline piece by piece.

For example:

                CSV File
                ↓
                Read a chunk
                ↓
                Parse CSV data
                ↓
                Check status === "PAID"
                ↓
                If matched → write to output
                ↓
                Read next chunk
                ↓
                Repeat

This is especially important for our POC because we are trying to keep the application's memory usage as low as possible while processing a large CSV file.

# Types of Streams

## 1. Readable Stream

A **Readable Stream** is a stream from which we can **read data**.

In our POC, we use:

```js
createReadStream(inputFile);
```

Example:

```js
const readableStream = createReadStream("input/data.csv");
```

The file is not loaded completely.

Instead, Node.js reads it in chunks:

            data.csv
            ↓
            Chunk 1
            ↓
            Chunk 2
            ↓
            Chunk 3
            ↓
            Chunk 4
            ↓
            ...

So:Readable Stream = data coming INTO our processing

In our POC:

input/data.csv
↓
Readable Stream

The readable stream is responsible for getting the CSV data from the file.

## 2. Writable Stream

A **Writable Stream** is a stream to which we can **write data**.

In our POC, we use:

```js
createWriteStream(outputFile);
```

Example:

```js
const writableStream = createWriteStream("output/filtered.txt");
```

When our processor finds a matching `PAID` record, we don't need to keep all matching records in memory.

We can directly send the result to the writable stream:

    PAID record
        ↓
    Writable Stream
        ↓
    output/filtered.txt

For example:

```js
writableStream.write(record);
```

So: Writable Stream = data going OUT of our processing

In our POC:

Processed data
↓
Writable Stream
↓
output/filtered.txt

## 3. Duplex Stream

A **Duplex Stream** can both **read and write data**.

So it has two directions:

                    READ
                    ↓
                    Duplex
                    ↑
                    WRITE

A common example is a network socket.

You can receive data from another computer and also send data back through the same connection.

        Other Computer
            ↓
        receive
            ↓
        Socket
            ↑
            send
            ↑
        Our Application

In our CSV POC, we don't really need a Duplex Stream.

Our file processing has a simpler flow:

Readable → Transform → Writable

So don't confuse **Duplex** with **Transform**.

A Transform Stream is built on top of the Duplex concept and adds processing logic.

## 4. Transform Stream

A **Transform Stream** is a special type of Duplex Stream.

It can:

        receive data
            ↓
        transform/process data
            ↓
        send modified data

This is the most important stream type in our CSV POC.

We created a Transform Stream to process the CSV data.

Conceptually:

        Readable Stream
            ↓
        CSV chunk
            ↓
        Transform Stream
            ↓
        Parse + filter
            ↓
        Processed data
            ↓
        Writable Stream

For example, our Transform Stream can receive CSV data and check whether the record contains:
`status = PAID`

If it matches:

            CSV record
                ↓
            status === "PAID"
                ↓
            YES
                ↓
            send to output

If it does not match:

            CSV record
                ↓
            status === "PAID"
                ↓
            NO
                ↓
            discard / don't send to output

So the Transform Stream acts like the **processing stage** of our POC.

# Our Complete Stream Pipeline

Our POC can be visualized like this:

                input/data.csv
                    ↓
                Readable Stream
                    ↓
                Read CSV chunks
                    ↓
                Transform Stream
                    ↓
                Parse CSV
                    ↓
                Filter PAID records
                    ↓
                Writable Stream
                    ↓
                output/filtered.txt

The important part is that data keeps moving through the pipeline.

We don't need to do this:

                4GB CSV
                ↓
                Load everything
                ↓
                RAM
                ↓
                Process everything
                ↓
                Write output

Instead, we do:

                CSV
                ↓
                small chunk
                ↓
                process
                ↓
                write
                ↓
                next chunk
                ↓
                process
                ↓
                write
                ↓
                next chunk

This is why Streams are useful for our POC.

# CommonJS and ECMAScript Modules

* A module is a separate JavaScript file that contains related code such as functions, classes, configuration, database logic, controllers, services, utilities, etc.
* In a real Node.js application, we use modules to separate different responsibilities instead of putting the entire application into one file.

For example:

```text
task-api/
├── src/
│   ├── server.js
│   ├── app.js
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   └── taskRoutes.js
│   ├── controllers/
│   │   └── taskController.js
│   ├── services/
│   │   └── taskService.js
│   ├── repositories/
│   │   └── taskRepository.js
│   └── middleware/
│       └── authMiddleware.js
└── package.json
```

* Each file has a specific responsibility.
* `server.js` starts the application.
* `routes` defines API endpoints.
* `controllers` handle HTTP requests and responses.
* `services` contain business logic.
* `repositories` communicate with the database.
* `config` contains configuration such as database connection.
* `middleware` handles reusable request-processing logic.

A typical request flow is:

`Client → Route → Controller → Service → Repository → Database`

* Modules allow these files to communicate with each other without putting everything into one large file.

# Two Module Systems

Node.js supports two major JavaScript module systems:

* CommonJS → `require()` and `module.exports`
* ECMAScript Modules (ESM) → `import` and `export`

Both solve the same high-level problem:

`One file needs functionality from another file → Module system → Import/Export`

But they have different syntax and module-loading behavior.

# CommonJS

* CommonJS is the traditional module system used by Node.js.
* It became the standard way of structuring Node.js applications before ESM became widely supported.
* CommonJS uses `require()` to consume another module and `module.exports` to expose functionality.

Basic structure:

```js
// Import
const taskService = require("./services/taskService");

// Export
module.exports = taskService;
```

# CommonJS in a Real Node.js Application

Imagine an existing Task Management API built using CommonJS.

```text
task-api/
├── src/
│   ├── server.js
│   ├── app.js
│   ├── routes/
│   │   └── taskRoutes.js
│   ├── controllers/
│   │   └── taskController.js
│   ├── services/
│   │   └── taskService.js
│   └── repositories/
│       └── taskRepository.js
└── package.json
```

## Database Module

`src/config/database.js`

```js
const mongoose = require("mongoose");

async function connectDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Database connected");
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}

module.exports = connectDatabase;
```

* This module is responsible only for establishing the database connection.
* Other files don't need to know how `mongoose.connect()` works.
* They only need the exported `connectDatabase` function.

`database.js → module.exports → server.js → require()`

## Server Module

`src/server.js`

```js
require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/database");

const PORT = process.env.PORT || 3000;

async function startServer() {
    await connectDatabase();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();
```

* `server.js` imports the Express application and database connection.
* It doesn't contain the database implementation itself.

The dependencies are:

`server.js → app.js`

`server.js → database.js`

## Application Module

`src/app.js`

```js
const express = require("express");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

app.use(express.json());

app.use("/api/tasks", taskRoutes);

module.exports = app;
```

* `app.js` creates the Express application.
* It imports the task routes.
* It exports the configured Express application.

`app.js → taskRoutes.js`

## Route Module

`src/routes/taskRoutes.js`

```js
const express = require("express");

const {
    getTasks,
    getTaskById,
    createTask,
    updateTaskStatus
} = require("../controllers/taskController");

const router = express.Router();

router.get("/", getTasks);
router.get("/:id", getTaskById);
router.post("/", createTask);
router.patch("/:id/status", updateTaskStatus);

module.exports = router;
```

* The route module defines which controller should handle each HTTP request.
* It does not contain the actual business logic.

For example:

`POST /api/tasks → createTask controller`

`GET /api/tasks → getTasks controller`

## Controller Module

`src/controllers/taskController.js`

```js
const taskService = require("../services/taskService");

async function getTasks(req, res, next) {
    try {
        const tasks = await taskService.getTasks();

        res.json({
            success: true,
            data: tasks
        });
    } catch (error) {
        next(error);
    }
}

async function getTaskById(req, res, next) {
    try {
        const task = await taskService.getTaskById(req.params.id);

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
}

async function createTask(req, res, next) {
    try {
        const task = await taskService.createTask(req.body);

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
}

async function updateTaskStatus(req, res, next) {
    try {
        const task = await taskService.updateTaskStatus(
            req.params.id,
            req.body.status
        );

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTaskStatus
};
```

* The controller imports the service module.
* It handles HTTP-specific work such as `req`, `res`, and HTTP status codes.
* It doesn't directly communicate with MongoDB.

`Controller → Service`

## Service Module

`src/services/taskService.js`

```js
const taskRepository = require("../repositories/taskRepository");

async function getTasks() {
    return taskRepository.findAll();
}

async function getTaskById(taskId) {
    const task = await taskRepository.findById(taskId);

    if (!task) {
        throw new Error("Task not found");
    }

    return task;
}

async function createTask(taskData) {
    if (!taskData.title) {
        throw new Error("Task title is required");
    }

    const task = {
        title: taskData.title,
        description: taskData.description || "",
        priority: taskData.priority || "medium",
        status: "pending"
    };

    return taskRepository.create(task);
}

async function updateTaskStatus(taskId, status) {
    const allowedStatuses = [
        "pending",
        "in-progress",
        "completed"
    ];

    if (!allowedStatuses.includes(status)) {
        throw new Error("Invalid task status");
    }

    return taskRepository.updateStatus(taskId, status);
}

module.exports = {
    getTasks,
    getTaskById,
    createTask,
    updateTaskStatus
};
```

* The service contains business rules.
* For example, a task must have a title.
* A task status can only be one of the allowed values.
* The service doesn't know anything about HTTP requests or responses.

`Controller → Service → Repository`

## Repository Module

`src/repositories/taskRepository.js`

```js
const Task = require("../models/task");

async function findAll() {
    return Task.find().sort({
        createdAt: -1
    });
}

async function findById(taskId) {
    return Task.findById(taskId);
}

async function create(taskData) {
    return Task.create(taskData);
}

async function updateStatus(taskId, status) {
    return Task.findByIdAndUpdate(
        taskId,
        { status },
        { new: true }
    );
}

module.exports = {
    findAll,
    findById,
    create,
    updateStatus
};
```

* The repository handles database operations.
* The service doesn't need to know how MongoDB queries are written.

The complete dependency flow is:

`Request → Route → Controller → Service → Repository → Database`

# `module.exports`

* `module.exports` defines what a CommonJS module makes available to other files.

For example:

```js
module.exports = {
    getTasks,
    getTaskById,
    createTask
};
```

Another file can then access those exported values:

```js
const {
    getTasks,
    getTaskById,
    createTask
} = require("../controllers/taskController");
```

* The object assigned to `module.exports` becomes the value returned by `require()`.

`module.exports → require() → imported value`

# `exports` vs `module.exports`

You may also see:

```js
exports.getTasks = getTasks;
exports.createTask = createTask;
```

* `exports` initially refers to the same object as `module.exports`.
* Therefore, adding properties to `exports` works.

But this is different:

```js
exports = getTasks;
```

* This does not replace `module.exports`.
* If you want to replace the entire exported value, use `module.exports`.

For example:

```js
module.exports = getTasks;
```

* When learning CommonJS, understanding `module.exports` is more important than relying heavily on `exports`.

# ECMAScript Modules

* ECMAScript Modules are the standardized JavaScript module system.
* They are commonly called ESM.
* ESM uses `import` to consume modules and `export` to expose modules.

CommonJS:

```js
const taskService = require("./services/taskService");
```

ESM:

```js
import taskService from "./services/taskService.js";
```

CommonJS:

```js
module.exports = taskService;
```

ESM:

```js
export default taskService;
```

# Enabling ESM in Node.js

One common way to enable ESM is adding this to `package.json`:

```json
{
    "type": "module"
}
```

Now `.js` files in that package are treated as ESM.

So this works:

```js
import express from "express";
```

Instead of:

```js
const express = require("express");
```

Node also supports explicit extensions:

```text
.mjs → ESM
.cjs → CommonJS
```

For normal projects, `"type": "module"` allows you to use `.js` files with ESM.

# The Same Task API Using ESM

The architecture doesn't change.

```text
Request → Route → Controller → Service → Repository → Database
```

Only the module system changes.

## ESM Database Module

`src/config/database.js`

```js
import mongoose from "mongoose";

export async function connectDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("Database connected");
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}
```

Instead of:

```js
module.exports = connectDatabase;
```

we use:

```js
export async function connectDatabase() {}
```

## ESM Server Module

`src/server.js`

```js
import "dotenv/config";

import app from "./app.js";
import { connectDatabase } from "./config/database.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
    await connectDatabase();

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();
```

* Notice that relative imports include `.js`.

```js
import app from "./app.js";
```

not:

```js
import app from "./app";
```

For normal Node ESM relative imports, include the extension.

## ESM Application Module

`src/app.js`

```js
import express from "express";
import taskRoutes from "./routes/taskRoutes.js";

const app = express();

app.use(express.json());

app.use("/api/tasks", taskRoutes);

export default app;
```

* The application module has one primary value to expose: the Express `app`.
* Therefore, a default export is appropriate here.

`app.js → export default app`

Then:

```js
import app from "./app.js";
```

## ESM Route Module

`src/routes/taskRoutes.js`

```js
import express from "express";

import {
    getTasks,
    getTaskById,
    createTask,
    updateTaskStatus
} from "../controllers/taskController.js";

const router = express.Router();

router.get("/", getTasks);
router.get("/:id", getTaskById);
router.post("/", createTask);
router.patch("/:id/status", updateTaskStatus);

export default router;
```

* The route module exports the router as its default value.
* The controller exposes multiple functions as named exports.

## ESM Controller Module

`src/controllers/taskController.js`

```js
import * as taskService from "../services/taskService.js";

export async function getTasks(req, res, next) {
    try {
        const tasks = await taskService.getTasks();

        res.json({
            success: true,
            data: tasks
        });
    } catch (error) {
        next(error);
    }
}

export async function getTaskById(req, res, next) {
    try {
        const task = await taskService.getTaskById(req.params.id);

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
}

export async function createTask(req, res, next) {
    try {
        const task = await taskService.createTask(req.body);

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
}

export async function updateTaskStatus(req, res, next) {
    try {
        const task = await taskService.updateTaskStatus(
            req.params.id,
            req.body.status
        );

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
}
```

* The controller has multiple functions.
* These are exposed as named exports.

Therefore:

```js
export async function getTasks() {}
export async function createTask() {}
```

can be imported as:

```js
import {
    getTasks,
    createTask
} from "../controllers/taskController.js";
```

# Named Export

A named export gives a specific exported value a name.

For example:

```js
export async function createTask() {
    // task creation logic
}

export async function updateTaskStatus() {
    // status update logic
}
```

Import:

```js
import {
    createTask,
    updateTaskStatus
} from "./taskController.js";
```

* Named exports are useful when a module exposes multiple related pieces of functionality.

Real examples:

```text
taskController.js → getTasks, createTask, updateTaskStatus

taskService.js → createTask, updateTaskStatus

taskRepository.js → findAll, findById, create
```

# Default Export

A default export is useful when a module has one primary value it exposes.

For example, an Express router:

```js
const router = express.Router();

export default router;
```

Then:

```js
import taskRoutes from "./routes/taskRoutes.js";
```

Another example is the Express application:

```js
export default app;
```

Then:

```js
import app from "./app.js";
```

The important difference is:

```text
Named export → import using the exported name

Default export → import without `{ }`
```

# `import * as`

ESM allows all named exports from a module to be imported as one namespace object.

For example:

```js
import * as taskService from "../services/taskService.js";
```

If the service exports:

```js
export async function getTasks() {}

export async function createTask() {}

export async function updateTaskStatus() {}
```

then:

```js
taskService.getTasks();

taskService.createTask();

taskService.updateTaskStatus();
```

This can be useful when you want to clearly group related functionality under one module name.

# CommonJS vs ESM in the Same Application

The application architecture stays the same.

CommonJS:

```js
const taskService = require("../services/taskService");

module.exports = {
    createTask
};
```

ESM:

```js
import * as taskService from "../services/taskService.js";

export function createTask() {}
```

The architecture remains:

`Route → Controller → Service → Repository → Database`

The module syntax changes, not the application architecture.

# Why Are There Two Module Systems?

* CommonJS became the traditional module system for Node.js.
* JavaScript later received a standardized module system called ECMAScript Modules.
* Node.js now supports both.

The historical progression is:

`Traditional Node.js → CommonJS → require() / module.exports`

`JavaScript standard → ESM → import / export`

* This is why you will encounter both systems when working with Node.js projects.

# Dynamic Imports

ESM supports dynamic imports using:

```js
const reportService = await import(
    "./services/reportService.js"
);
```

This is different from a normal import:

```js
import reportService from "./services/reportService.js";
```

* Normal imports define dependencies as part of the module structure.
* Dynamic imports allow a module to be loaded when it is actually needed.

For example, suppose an admin API has an expensive report feature:

```js
if (requestType === "report") {
    const reportModule = await import(
        "./services/reportService.js"
    );

    await reportModule.generateReport();
}
```

The report module doesn't have to be loaded through a normal top-level import if that functionality is only needed for certain requests.

# Top-Level Await

ESM supports top-level `await`.

For example:

```js
const configuration = await loadConfiguration();
```

You don't have to wrap this in another async function.

This can be useful when a module needs to complete asynchronous initialization before the rest of the module continues.

# `__dirname` and `__filename`

CommonJS provides:

```js
console.log(__dirname);
console.log(__filename);
```

These variables are not directly available in ESM.

ESM provides:

```js
import.meta.url
```

You can create equivalent values:

```js
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

# Common Mistakes

## Mixing Module Systems Randomly

Don't randomly mix:

```js
const express = require("express");
```

and:

```js
import taskService from "./taskService.js";
```

throughout the project without understanding the interoperability rules.

For a normal application, choose one module system and use it consistently.

## Forgetting `"type": "module"`

If your project uses:

```js
import express from "express";
```

make sure Node knows the project uses ESM:

```json
{
    "type": "module"
}
```

Alternatively, use `.mjs`.

## Forgetting `.js` in ESM Imports

Use:

```js
import taskService from "./taskService.js";
```

rather than assuming Node will automatically resolve:

```js
import taskService from "./taskService";
```

## Confusing Named and Default Exports

If the module has:

```js
export function createTask() {}
```

import it with:

```js
import { createTask } from "./taskController.js";
```

If the module has:

```js
export default router;
```

import it with:

```js
import router from "./taskRoutes.js";
```

The `{ }` indicate a named import.

# When to Use What

* Use CommonJS when you are working on an existing Node.js project that already uses `require()` and `module.exports`.
* Learn CommonJS because you will encounter it in existing Node.js applications, older projects, configurations, and packages.
* For a new Node.js application, ESM is a good modern choice.
* If your project uses ESM, keep the project consistently ESM instead of mixing systems unnecessarily.
* If your mentor or company project specifically uses CommonJS, follow that project's module system.


# Module 2: Express.js Routing & HTTP Architecture

## Initializing an Express application and configuring environmental constants with dotenv

- Express.js is a web framework built on top of Node.js HTTP capabilities.
- In raw Node.js, we manually work with `http.createServer()`, inspect `req.method`, inspect `req.url`, parse request bodies, and decide how to route requests.
- Express gives us a structured way to handle these responsibilities:
  - routing
  - request parsing
  - middleware
  - response handling
  - error handling
  - API organization

- Real-world analogy:
  - Raw Node.js is like managing an entire hotel reception manually.
  - You receive the guest, identify what they need, check their request, find the correct department, and respond.
  - Express is like having a proper hotel reception system:
    - routes decide which department handles the request
    - middleware performs common checks
    - controllers perform business operations
    - responses are standardized

- Basic project setup:

```bash
mkdir module2-express
cd module2-express
npm init -y
npm install express dotenv
```

- A basic Express application:

```js
const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.json({
    message: "API is running",
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

- `express()` creates an Express application object.
- `app.get()` registers a route for HTTP GET requests.
- `req` contains information about the incoming request.
- `res` is used to send a response to the client.
- `res.json()` sends a JSON response.
- `app.listen()` starts the HTTP server.

- In a real application, do not hardcode values such as ports, database URLs, API keys, or JWT secrets directly in source code.

- Example of a bad approach:

```js
const port = 3000;
const databaseUrl = "mongodb://localhost:27017/company";
```

- The problem is that different environments normally need different values:
  - local development
  - testing
  - staging
  - production

- `dotenv` loads environment variables from a `.env` file into `process.env`.

- Example `.env`:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/company
JWT_SECRET=my-secret-key
```

- Load dotenv before accessing the variables:

```js
require("dotenv").config();

const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    message: "API is running",
    environment: process.env.NODE_ENV,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

- Real-world analogy:
  - `.env` is like a private configuration sheet given to each branch of a company.
  - The application code is the same in every branch.
  - Each branch can have different configuration values.
  - You do not rewrite the company's operating procedure just because the database address changed.

- Important:
  - Never commit `.env` when it contains secrets.
  - Add `.env` to `.gitignore`.
  - Commit a `.env.example` containing only the required variable names.

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

- A better production structure separates configuration from application startup:

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

````

* `src/config/env.js`:

```js
require("dotenv").config();

module.exports = {
    port: Number(process.env.PORT) || 3000,
    nodeEnv: process.env.NODE_ENV || "development",
    databaseUrl: process.env.DATABASE_URL
};
````

- `src/app.js`:

```js
const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "API is running",
  });
});

module.exports = app;
```

- `src/server.js`:

```js
const app = require("./app");
const config = require("./config/env");

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
```

- This separation is useful because:
  - `app.js` creates/configures the application.
  - `server.js` starts the network server.
  - `env.js` manages environment configuration.
  - tests can import `app` without automatically opening a server port.

## HTTP request methods and semantic status codes

- HTTP methods describe what the client wants to do with a resource.
- A REST API commonly uses:
  - `GET` → retrieve data
  - `POST` → create a resource or trigger an operation
  - `PUT` → replace an existing resource
  - `PATCH` → partially update an existing resource
  - `DELETE` → remove a resource

- Real-world analogy:
  - Imagine a company employee management system.
  - `GET /api/v1/employees` means "show me the employees."
  - `POST /api/v1/employees` means "create a new employee."
  - `PUT /api/v1/employees/101` means "replace employee 101's complete record."
  - `PATCH /api/v1/employees/101` means "change only part of employee 101's record."
  - `DELETE /api/v1/employees/101` means "remove employee 101."

- `GET` example:

```js
app.get("/api/v1/users", (req, res) => {
  res.status(200).json({
    users: [],
  });
});
```

- `POST` example:

```js
app.post("/api/v1/users", (req, res) => {
  const user = req.body;

  res.status(201).json({
    message: "User created",
    user,
  });
});
```

- `PUT` example:

```js
app.put("/api/v1/users/:id", (req, res) => {
  const { id } = req.params;

  res.status(200).json({
    message: `User ${id} replaced`,
    user: req.body,
  });
});
```

- `PATCH` example:

```js
app.patch("/api/v1/users/:id", (req, res) => {
  const { id } = req.params;

  res.status(200).json({
    message: `User ${id} partially updated`,
    changes: req.body,
  });
});
```

- `DELETE` example:

```js
app.delete("/api/v1/users/:id", (req, res) => {
  const { id } = req.params;

  res.status(204).send();
});
```

- `PUT` and `PATCH` are not interchangeable:
  - `PUT` generally represents replacement of the resource representation.
  - `PATCH` represents partial modification.
  - If a user has `{ name, email, phone }`, a PATCH containing only `{ phone }` means only the phone needs to change.
  - A PUT request may be designed to provide the complete representation.

- Status codes communicate what happened with the request.

- Common `2xx` success codes:
  - `200 OK` → request succeeded and a response body is normally returned.
  - `201 Created` → a new resource was successfully created.
  - `202 Accepted` → request was accepted for processing, but processing may happen later.
  - `204 No Content` → request succeeded and there is no response body.

- Common `4xx` client-side error codes:
  - `400 Bad Request` → request is malformed or invalid.
  - `401 Unauthorized` → authentication is required or authentication failed.
  - `403 Forbidden` → the server understood the request but refuses to authorize it.
  - `404 Not Found` → requested resource does not exist.
  - `409 Conflict` → request conflicts with the current resource state.
  - `422 Unprocessable Content` → request structure is understandable, but validation failed.

- Common `5xx` server-side error codes:
  - `500 Internal Server Error` → unexpected server-side failure.
  - `502 Bad Gateway` → a gateway/proxy received an invalid response from an upstream server.
  - `503 Service Unavailable` → service is temporarily unable to handle the request.

- Do not return `200` for every situation.

- Bad API behavior:

```js
app.get("/api/v1/users/:id", (req, res) => {
  const user = findUser(req.params.id);

  if (!user) {
    return res.status(200).json({
      message: "User not found",
    });
  }

  res.status(200).json(user);
});
```

- The client sees `200`, which means the HTTP request succeeded. It now has to inspect the response body to understand that the requested resource was not found.
- Better:

```js
app.get("/api/v1/users/:id", (req, res) => {
  const user = findUser(req.params.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  res.status(200).json(user);
});
```

- Status codes are part of the API contract.
- Frontend applications, mobile apps, API gateways, monitoring systems, and other services can use them to determine what happened without guessing from arbitrary response text.

## Deconstructing incoming data with req.params, req.query, and express.json()

- An HTTP request can carry information in different places.
- The three important places for this module are:
  - URL path parameters → `req.params`
  - query string parameters → `req.query`
  - request body → `req.body`

- Think of an API request as a delivery:
  - `req.params` tells the delivery person exactly which resource/address is being targeted.
  - `req.query` gives optional instructions for how to search/filter/sort the request.
  - `req.body` contains the actual information being submitted.

- `req.params` is used for values embedded inside the URL path.

```js
app.get("/api/v1/users/:id", (req, res) => {
  console.log(req.params);
  console.log(req.params.id);

  res.json({
    userId: req.params.id,
  });
});
```

- Request:

GET /api/v1/users/42

````

* `req.params` becomes:

```js
{
    id: "42"
}
````

- Multiple parameters are possible:

```js
app.get("/api/v1/companies/:companyId/users/:userId", (req, res) => {
  const { companyId, userId } = req.params;

  res.json({
    companyId,
    userId,
  });
});
```

- Request:

GET /api/v1/companies/10/users/42

```

* Use path parameters when the value identifies a specific resource.

* Good:


GET /api/v1/users/42
GET /api/v1/products/1001
GET /api/v1/orders/500
```

- `req.query` reads values after `?` in the URL.

```js
app.get("/api/v1/users", (req, res) => {
  const { page, limit, search } = req.query;

  res.json({
    page,
    limit,
    search,
  });
});
```

- Request:

GET /api/v1/users?page=2&limit=20&search=gowtham

````

* `req.query` becomes approximately:

```js
{
    page: "2",
    limit: "20",
    search: "gowtham"
}
````

- Query values arrive as strings, so convert them when numeric behavior is required.

```js
const page = Number(req.query.page) || 1;
const limit = Number(req.query.limit) || 20;
```

- Query parameters are commonly used for:
  - filtering
  - searching
  - sorting
  - pagination
  - optional behavior

- Example production-style endpoint:

```js
app.get("/api/v1/products", (req, res) => {
  const { category, search, page = "1", limit = "20" } = req.query;

  const pageNumber = Number(page);
  const limitNumber = Number(limit);

  res.json({
    filters: {
      category,
      search,
    },
    pagination: {
      page: pageNumber,
      limit: limitNumber,
    },
  });
});
```

- `req.params` vs `req.query`:

GET /api/v1/products/101

```

* `101` is part of the resource path, so it belongs to `req.params`.


GET /api/v1/products?category=laptop&page=2
```

- `category` and `page` are optional search/listing instructions, so they belong to `req.query`.

- Request bodies are commonly used with `POST`, `PUT`, and `PATCH`.

- Express does not automatically parse JSON request bodies unless JSON parsing middleware is enabled.

```js
app.use(express.json());
```

- After this middleware is registered, JSON request bodies can be accessed through `req.body`.

- Example:

```js
app.use(express.json());

app.post("/api/v1/users", (req, res) => {
  const { name, email, age } = req.body;

  res.status(201).json({
    message: "User created",
    user: {
      name,
      email,
      age,
    },
  });
});
```

- Client request:

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

- Without `express.json()`, `req.body` will not be populated for normal JSON payloads by Express's JSON parser.

- Middleware execution order matters.

```js
app.use(express.json());

app.post("/api/v1/users", (req, res) => {
  console.log(req.body);
  res.status(201).json(req.body);
});
```

- `express.json()` runs before the route handler.
- It reads the JSON request body.
- It parses the JSON.
- It makes the parsed object available as `req.body`.
- The route handler can then use it.

- Real production example:
  - A job application API might receive:

```json
{
  "name": "Gowtham",
  "email": "gowtham@example.com",
  "skills": ["JavaScript", "Node.js", "Express"]
}
```

- The route can then validate the payload before sending it to a service/database layer.

```js
app.post("/api/v1/applications", (req, res) => {
  const { name, email, skills } = req.body;

  if (!name || !email || !Array.isArray(skills)) {
    return res.status(400).json({
      error: "Invalid application data",
    });
  }

  res.status(201).json({
    message: "Application received",
  });
});
```

- Important security point:
  - `req.body` is client-controlled input.
  - Never assume it is trustworthy.
  - Validate required fields.
  - Validate data types.
  - Validate allowed values.
  - Apply size limits where appropriate.
  - Never directly trust values just because they came through your API.

- You can configure a JSON body size limit:

```js
app.use(
  express.json({
    limit: "1mb",
  }),
);
```

- This is useful because clients should not be able to send arbitrarily large JSON payloads to an endpoint that expects a small request.

## Structuring routes with express.Router()

- As an application grows, putting every route inside `app.js` becomes difficult to maintain.

- Bad structure:

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

- It may work technically, but the file becomes a large mixture of unrelated resources.

- `express.Router()` creates a modular routing system.

- Real-world analogy:
  - Imagine a company with departments.
  - The main reception does not personally handle HR, finance, sales, support, and engineering.
  - It sends the request to the correct department.
  - `app.js` acts like the main reception.
  - Each router acts like a department responsible for one resource.

- Example structure:

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

````

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
````

- Product router:

```js
const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    message: "Get all products",
  });
});

router.get("/:id", (req, res) => {
  res.json({
    message: `Get product ${req.params.id}`,
  });
});

router.post("/", (req, res) => {
  res.status(201).json({
    message: "Create product",
  });
});

module.exports = router;
```

- Mount the routers in `app.js`:

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

- Notice how the router itself does not repeat `/api/v1/users`.

- Because of:

```js
app.use("/api/v1/users", userRouter);
```

- this router:

```js
router.get("/");
```

- becomes:

GET /api/v1/users

````

* And:

```js
router.get("/:id");
````

- becomes:

GET /api/v1/users/:id

```

* This is called mounting a router.

* A production-style API might look like:


/api/v1/users
/api/v1/users/:id

/api/v1/products
/api/v1/products/:id

/api/v1/orders
/api/v1/orders/:id
```

- The `/api/v1` portion is commonly used for API versioning.
- Versioning allows a future API version to coexist with an older version.

- For example:

/api/v1/users
/api/v2/users

```

* A breaking change can be introduced in `v2` while existing clients continue using `v1`.

* Keep resource names generally plural:


/api/v1/users
/api/v1/products
/api/v1/orders
```

- Avoid action-heavy URLs when a normal HTTP method expresses the operation:

POST /api/v1/users

```

* is usually preferable to:


POST /api/v1/create-user
```

- Similarly:

DELETE /api/v1/users/42

```

* expresses deletion through the HTTP method, so:


POST /api/v1/delete-user/42
```

- is generally unnecessary for a conventional REST resource API.

- A clean module-level implementation can look like this:

module2-express/
│
├── src/
│ ├── config/
│ │ └── env.js
│ │
│ ├── routes/
│ │ ├── user.routes.js
│ │ └── product.routes.js
│ │
│ ├── app.js
│ └── server.js
│
├── .env
├── .env.example
├── .gitignore
└── package.json

````

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
````

- `src/server.js`:

```js
const app = require("./app");
const config = require("./config/env");

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
```

- The request flow now looks like:

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


Route
  ↓
Controller
  ↓
Service
  ↓
Repository / Database
```

- For example:

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

````

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
````

```json
{
  "phone": "+91-9876543210"
}
```

- Express receives the request.
- `express.json()` parses the JSON body.
- The router matches `/api/v1/users/:id`.
- `req.params.id` gives `"42"`.
- `req.body` gives `{ phone: "+91-9876543210" }`.
- The controller validates the input.
- The service performs the business operation.
- The repository/database layer updates the user.
- The API returns an appropriate status:

```http
200 OK
```

```json
{
  "id": 42,
  "phone": "+91-9876543210"
}
```

- If user `42` does not exist:

```http
404 Not Found
```

```json
{
  "error": "User not found"
}
```

- If the phone value is invalid:

```http
422 Unprocessable Content
```

```json
{
  "error": "Invalid phone number"
}
```

- The important idea is that HTTP itself carries meaning:
  - method → what operation is requested
  - URL → which resource is involved
  - query → optional filtering/instructions
  - body → submitted data
  - status code → what happened
  - JSON response → information the client can consume

## Common mistakes to avoid

- Hardcoding secrets or environment-specific configuration in JavaScript files.
- Committing `.env` to Git.
- Forgetting `app.use(express.json())` when accepting JSON request bodies.
- Treating every request as `POST`.
- Using `200 OK` for errors such as missing resources.
- Confusing `req.params` with `req.query`.
- Forgetting that query and path parameter values normally arrive as strings.
- Trusting `req.body` without validation.
- Putting every route in `app.js`.
- Mixing database/business logic directly into every route handler.
- Using `POST /create-user` when a resource-oriented `POST /users` is sufficient.
- Using `PUT` when the intended operation is only a partial update, without deliberately defining the API's PUT semantics.
- Forgetting to return after sending an early error response:

```js
if (!user) {
  return res.status(404).json({
    error: "User not found",
  });
}
```

- Returning two responses from the same request is an error:

```js
if (!user) {
  res.status(404).json({
    error: "User not found",
  });
}

res.json(user);
```

- The `return` prevents execution from continuing after the error response.

# Express Middleware Mechanics & Data Validation

This module is about controlling what happens to an HTTP request before it reaches the actual business logic.

In the Task Manager API, a request should not directly jump from:

Client → Controller → Database

A better structure is:

Client
|
Application Middleware
|
Router Middleware
|
Authentication
|
Validation
|
Controller
|
Service / Database
|
Response

If something goes wrong at any stage, the error should move to one central error handler instead of every route creating its own error response.

The main idea is:

- middleware controls the journey
- validation controls what data is allowed inside
- `res.locals` carries request-specific information
- custom errors describe expected failures
- centralized error handling controls the final error response

# 1. What Express Middleware Is

Middleware is a function that runs between receiving a request and sending the final response.

A middleware normally receives:

```js
(req, res, next);
```

It can:

- inspect the request
- modify request or response-related data
- perform authentication
- validate input
- log information
- stop the request and send a response
- pass control to the next middleware
- pass an error to the error-handling middleware

A simple mental model is a series of checkpoints.

When a user creates a task:

POST /tasks

Request
|
Is request JSON?
|
Is user authenticated?
|
Is task data valid?
|
Create task
|
Send response

Each checkpoint is middleware.

In the Task Manager API, instead of putting authentication and validation directly inside the controller, I can keep them as separate middleware.

```js
router.post("/", authenticate, validate(createTaskSchema), createTask);
```

This makes the controller responsible mainly for creating the task rather than checking everything that happened before it.

# 2. `req`, `res`, `next`

## `req`

`req` represents the incoming HTTP request.

It contains information sent by the client.

Common properties:

````js
req.params
req.query
req.body
req.headers
req.method
req.path
``
For:

POST /tasks/42?notify=true

I might access:

```js
req.params.id
req.query.notify
req.body
req.headers.authorization
````

Example:

```js
router.get("/tasks/:id", (req, res) => {
  console.log(req.params.id);
});
```

## `res`

`res` represents the response that my server sends back.

Common methods:

```js
res.status();
res.json();
res.send();
res.end();
```

Example:

```js
res.status(201).json({
  message: "Task created",
});
```

Once I send the response, the request lifecycle normally ends.

## `next`

`next` tells Express to continue to the next middleware.

```js
function logger(req, res, next) {
  console.log(req.method, req.path);
  next();
}
```

Without `next()` or a response, the request can remain hanging.

A middleware has two basic choices:

Do something and continue
|
next()

OR

Do something and finish
|
res.json(...)

# 3. `next()` and Middleware Flow

Middleware executes in the order in which Express receives it.

```js
app.use(first);
app.use(second);
app.use(third);
```

The flow is:

Request
|
first
| next()
second
| next()
third
|
Route

For the Task Manager API:

```js
router.post("/", authenticate, validate(createTaskSchema), createTask);
```

The execution is:

POST /tasks
|
authenticate
| next()
validate
| next()
createTask
|
response

If `authenticate` rejects the request:

```js
return next(new AppError("Authentication required", 401));
```

then `validate` and `createTask` are not executed.

This is important because validation or database operations should not happen after authentication has already failed.

# Middleware Execution Order

Express does not automatically decide which middleware should run first. The order in which I register middleware determines the execution order.

For example:

```js
app.use(express.json());
app.use(requestLogger);
app.use("/api/tasks", taskRouter);
```

The request first passes through:

express.json()
|
requestLogger
|
taskRouter

If I accidentally place the router before a required middleware:

````js
app.use("/api/tasks", taskRouter);
app.use(authenticate);

the authentication middleware may never protect those routes because the router can finish the request before Express reaches the later middleware.

A useful rule is:

General middleware
        |
Security/authentication
        |
Router
        |
Route-specific middleware
        |
Controller
        |
Error handler

The exact structure can vary, but the dependency order matters.

# Application-Level Middleware

Application-level middleware is attached to the main Express application.

```js
app.use(...)
````

These are usually things that apply to many or all routes.

Example:

```js
app.use(express.json());
```

This allows Express to parse JSON request bodies.

For the Task Manager API, I can also have:

```js
app.use(requestLogger);
app.use(express.json());
app.use("/api/tasks", taskRouter);
app.use(errorHandler);
```

A request such as:

POST /api/tasks

passes through application-level middleware before reaching the task router.

Typical uses:

- JSON parsing
- request logging
- CORS
- security headers
- global request IDs
- global error handling

I should not put task-specific logic into application middleware if it is only relevant to `/tasks`.

# 6. Router-Level Middleware

Router-level middleware is attached to an Express router.

```js
const router = express.Router();

router.use(...);
```

Suppose my API has:

/api/tasks
/api/users
/api/comments

A middleware that applies only to task routes can live inside the task router.

```js
const taskRouter = express.Router();

taskRouter.use(authenticate);

taskRouter.get("/", getTasks);
taskRouter.post("/", validate(createTaskSchema), createTask);
```

Now authentication applies to the task router.

The structure becomes:

Application
|
/api/tasks router
|
authenticate
|
task route

This is cleaner than putting task-specific middleware globally.

# 7. Route-Level Middleware

Route-level middleware is attached directly to a specific route.

```js
router.post("/", authenticate, validate(createTaskSchema), createTask);
```

Here:

authenticate
validate
createTask

are part of that route's pipeline.

This is useful when different routes need different rules.

For example:

```js
router.get("/", authenticate, getTasks);

router.post("/", authenticate, validate(createTaskSchema), createTask);

router.delete("/:id", authenticate, authorize("admin"), deleteTask);
```

The delete operation has an additional authorization requirement.

This avoids putting every rule into every controller.

# 8. Custom Middleware

Custom middleware is middleware that I write for application-specific behavior.

Example authentication middleware:

```js
function authenticate(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  // verify token
  next();
}
```

Example request logging middleware:

```js
function requestLogger(req, res, next) {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
}
```

The important design principle is that one middleware should have one clear responsibility.

Bad:

```js
function everything(req, res, next) {
  // authenticate
  // validate
  // load database user
  // check permissions
  // create task
}
```

Better:

authenticate
|
authorize
|
validate
|
controller

This makes individual pieces easier to test and reuse.

# 9. `res.locals`

`res.locals` stores data that belongs to the current request/response cycle.

For example, after authentication I may know which user is making the request.

```js
res.locals.user = user;
```

The next middleware can access:

```js
res.locals.user;
```

The controller can also access it.

Example:

```js
function authenticate(req, res, next) {
  const user = verifyToken(req.headers.authorization);

  if (!user) {
    return next(new AppError("Invalid token", 401));
  }

  res.locals.user = user;

  next();
}
```

Then:

```js
async function createTask(req, res, next) {
  const user = res.locals.user;

  const task = await Task.create({
    title: req.body.title,
    ownerId: user.id,
  });

  res.status(201).json(task);
}
```

This is useful because the authenticated user is tied to the current request.

I do not want to put request-specific users into a global variable:

```js
let currentUser;
```

That would be unsafe when multiple users make requests concurrently.

# 10. Request-Scoped State

Request-scoped state means data that belongs only to one request.

Suppose two users make requests at almost the same time:

Request A → Gowtham
Request B → Arun

The server must not accidentally mix their information.

With:

```js
res.locals.user

each request gets its own state.

Request A
res.locals.user → Gowtham

Request B
res.locals.user → Arun
```

This is why request-specific data should not be stored in global variables.

For the Task Manager API, request-scoped state could contain:

```js
res.locals.user;
res.locals.requestId;
res.locals.permissions;
```

The exact values depend on the application.

# 11. Middleware Chaining

Middleware chaining means multiple middleware functions are executed one after another.

Example:

```js
router.post(
  "/",
  authenticate,
  authorize("manager"),
  validate(createTaskSchema),
  createTask,
);
```

The flow is:

Request
|
authenticate
|
authorize
|
validate
|
createTask
|
Response

Each middleware decides whether the request is allowed to continue.

This creates a pipeline where each stage handles one concern.

For example:

Authentication
|
Authorization
|
Validation
|
Business Logic

If authorization fails:

```js
return next(new AppError("You do not have permission", 403));
```

the validation and controller should not execute.

# 12. `next(error)`

`next()` means:

continue normally

`next(error)` means:

something went wrong
send this error through the error-handling pipeline

Example:

```js
function authenticate(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  next();
}
```

I should return after calling `next(error)` when there is no more work to perform.

```js
return next(error);
```

This prevents accidental execution of code below it.

The important difference is:

```js
next();
```

means:

continue request

while:

```js
next(error);
```

means:

skip normal middleware and move toward error handling

# 13. Global Error-Handling Middleware

Instead of every controller producing its own error format, I can create one centralized error handler.

Express recognizes error-handling middleware because it has four parameters:

```js
function errorHandler(err, req, res, next) {
  // ...
}
```

Example:

```js
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message,
  });
}
```

Then register it after the routes:

```js
app.use("/api/tasks", taskRouter);

app.use(errorHandler);
```

A task controller can simply do:

```js
return next(new AppError("Task not found", 404));
```

The global error handler decides how the final response should look.

This gives the API a consistent error format.

Example response:

```json
{
  "success": false,
  "message": "Task not found"
}
```

# 14. `AppError`

JavaScript's normal `Error` tells me that something failed, but for an API I usually also need information such as HTTP status code.

Instead of repeatedly creating objects like:

```js
const error = new Error("Task not found");
error.statusCode = 404;
```

I can create an application-specific error class.

```js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true;
  }
}
```

Now I can write:

```js
throw new AppError("Task not found", 404);
```

or:

```js
return next(new AppError("Authentication required", 401));
```

The error handler can use:

```js
err.statusCode;
err.message;
err.isOperational;
```

This gives my application a consistent way to represent expected API failures.

# 15. Operational vs Unexpected Errors

Not every error means the same thing.

## Operational errors

These are expected situations that the application knows how to handle.

Examples from the Task Manager API:

Task does not exist
→ 404

Missing authentication
→ 401

User has no permission
→ 403

Invalid request data
→ 400

These can be represented with:

```js
new AppError("Task not found", 404);
```

The server itself is still functioning normally.

## Unexpected errors

These indicate a programming or infrastructure problem.

For example:

```js
const task = undefined;

console.log(task.owner.id);
```

This can produce a runtime error.

Other examples:

- unexpected database failure
- programming bug
- incorrect assumption in code
- unavailable external dependency

I should not expose internal details such as stack traces to normal API clients.

The client might receive:

```json
{
  "success": false,
  "message": "Internal server error"
}
```

while the actual stack trace is logged on the server.

# 16. HTTP Status Codes for Errors

Status codes communicate what happened to the client.

Common ones for the Task Manager API:

400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error

## 400 Bad Request

The request itself is invalid.

Example:

POST /tasks

with malformed or unacceptable request data.

## 401 Unauthorized

The client has not successfully authenticated.

Example:

Authorization header missing

## 403 Forbidden

The user is authenticated but does not have permission.

Example:

normal user trying to perform an admin-only operation

## 404 Not Found

The requested resource does not exist.

Example:

GET /tasks/9999

when task `9999` does not exist.

## 409 Conflict

The request conflicts with the current state.

Example:

trying to create a task with a unique identifier that already exists

## 422 Unprocessable Entity

The request has the correct general structure, but the supplied values fail semantic validation.

The exact use of `400` vs `422` should be consistent with the API's chosen convention.

## 500 Internal Server Error

Something unexpected happened on the server.

I should not use `500` for normal client mistakes.

# 17. Async Error Handling

Controllers often perform asynchronous operations:

```js
async function getTask(req, res, next) {
  const task = await Task.findById(req.params.id);

  res.json(task);
}
```

But the database operation can fail.

For example:

```js
async function getTask(req, res, next) {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return next(new AppError("Task not found", 404));
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
}
```

The important part is that the asynchronous failure eventually reaches the centralized error handler.

A reusable async wrapper can reduce repeated `try/catch` blocks:

```js
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

Then:

```js
router.get("/:id", asyncHandler(getTask));
```

Now unexpected asynchronous errors are forwarded to:

asyncHandler
|
next(error)
|
global errorHandler

Whether I use a wrapper depends on the Express version and project style, but the underlying principle stays the same: async failures must reach the centralized error pipeline.

# 18. Why Input Validation Is Necessary

Anything coming from the client should be treated as untrusted input.

Suppose my Task Manager expects:

```json
{
  "title": "Finish API module",
  "description": "Complete middleware implementation",
  "priority": "high"
}
```

A client could send:

```json
{
  "title": 123,
  "description": true,
  "priority": "whatever"
}
```

If I directly use this data:

```js
const task = await Task.create(req.body);
```

I am trusting the client to follow my API contract.

That is a mistake.

Validation creates a boundary:

Untrusted input
|
Validation
|
Trusted application data
|
Business logic

Validation should happen before the controller performs important business operations.

For the Task Manager API:

POST /tasks
|
Authentication
|
Validate body
|
Controller
|
Database

This prevents invalid data from reaching deeper layers.

# 19. Zod / Joi Schemas

A schema describes what valid data should look like.

For example, using Zod:

```js
import { z } from "zod";

const createTaskSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(["low", "medium", "high"]),
});
```

This creates an explicit API contract.

Instead of explaining separately:

title must be a string
title must have at least 3 characters
priority must be low/medium/high

the schema becomes the executable definition.

The same idea can be implemented using Joi.

The important concept is not memorizing the library API. The important concept is:

Define expected shape
|
Validate incoming data
|
Reject invalid data
|
Allow valid data into business logic

# 20. Required / Optional Fields

Suppose creating a task requires:

title
priority

but description is optional.

A Zod schema can express that:

```js
const createTaskSchema = z.object({
  title: z.string(),
  priority: z.enum(["low", "medium", "high"]),
  description: z.string().optional(),
});
```

Now:

```json
{
  "title": "Complete API",
  "priority": "high"
}
```

is valid.

But:

```json
{
  "priority": "high"
}
```

fails because `title` is required.

This is useful because different operations may have different schemas.

For example:

Create Task
→ title required

Update Task
→ title optional

So I should not blindly reuse one schema for every operation.

# 21. Type Validation

The schema can verify that values have the expected types.

For example:

```js
const schema = z.object({
  title: z.string(),
  estimatedHours: z.number(),
  completed: z.boolean(),
});
```

Valid:

```json
{
  "title": "Build middleware",
  "estimatedHours": 4,
  "completed": false
}
```

Invalid:

```json
{
  "title": 123,
  "estimatedHours": "four",
  "completed": "no"
}
```

This protects the controller from making assumptions such as:

```js
req.body.estimatedHours * 2;
```

when the client actually supplied:

"four"

Validation establishes the expected type before business logic uses the value.

# 22. String / Number / Email Validation

Validation is not limited to checking types.

I can check constraints.

Example:

```js
const userSchema = z.object({
  name: z.string().min(2).max(50),
  age: z.number().int().min(18).max(100),
  email: z.string().email(),
});
```

Here:

name
→ string
→ 2–50 characters

age
→ number
→ integer
→ 18–100

email
→ valid email format

For the Task Manager API, similar rules can be applied to:

task title
task description
priority
due date
estimated hours

The important thing is to validate according to the actual business rule, not just add random restrictions.

# 23. Nested Object / Array Validation

Real APIs rarely contain only flat data.

For example, a task could contain labels:

```json
{
  "title": "Build API",
  "labels": [
    {
      "name": "backend",
      "color": "blue"
    },
    {
      "name": "express",
      "color": "green"
    }
  ]
}
```

The schema can describe the nested structure.

```js
const labelSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
});

const createTaskSchema = z.object({
  title: z.string().min(3),
  labels: z.array(labelSchema).optional(),
});
```

Now validation happens recursively.

The API can verify:

labels
|
array
|
each item
|
object
|
name + color

This becomes especially important when API payloads become more complex.

# 24. Validation Middleware

Instead of writing validation directly inside every controller, I can create reusable middleware.

Example:

```js
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(new AppError("Invalid request data", 400));
    }

    res.locals.validatedBody = result.data;

    next();
  };
}
```

Then my route becomes:

```js
router.post("/", authenticate, validate(createTaskSchema), createTask);
```

The controller does not need to repeat validation logic.

A more complete implementation can preserve structured validation details:

```js
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const error = new AppError("Validation failed", 400);

      error.details = result.error.issues;

      return next(error);
    }

    res.locals.validatedBody = result.data;

    next();
  };
}
```

Now the global error handler can decide how much validation information should be returned.

# 25. Connecting Validation → Controller → Error Handler

This is the most important part of the module.

The complete Task Manager flow can look like this:

```js
router.post("/", authenticate, validate(createTaskSchema), createTask);
```

## Step 1 — Authentication

```js
function authenticate(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return next(new AppError("Authentication required", 401));
  }

  const user = verifyToken(token);

  if (!user) {
    return next(new AppError("Invalid token", 401));
  }

  res.locals.user = user;

  next();
}
```

The authenticated user is now available to later middleware.

res.locals.user

## Step 2 — Validation

```js
const createTaskSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  priority: z.enum(["low", "medium", "high"]),
});
```

Validation middleware:

```js
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const error = new AppError("Validation failed", 400);

      error.details = result.error.issues;

      return next(error);
    }

    res.locals.validatedBody = result.data;

    next();
  };
}
```

Now only validated data moves forward.

## Step 3 — Controller

The controller can focus on the actual task creation.

```js
async function createTask(req, res, next) {
  try {
    const user = res.locals.user;
    const data = res.locals.validatedBody;

    const task = await Task.create({
      ...data,
      ownerId: user.id,
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    next(error);
  }
}
```

Notice that the controller does not need to ask:

Is the user authenticated?
Is title a string?
Is priority valid?

Those responsibilities already belong to earlier stages.

## Step 4 — Error Handler

Finally:

```js
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Internal server error" : err.message,
    ...(err.details && {
      details: err.details,
    }),
  });
}
```

Registered once:

```js
app.use(errorHandler);
```

The complete flow is now:

POST /api/tasks
|
authenticate
|
valid user?
/ \
 no yes
| |
401 validate
|
valid payload?
/ \
 no yes
| |
400 createTask
|
database
|
201

Any unexpected error
|
next(error)
|
global errorHandler
|
500

# Putting the POC Together

A clean Task Manager API structure could look like:

task-manager/
│
├── src/
│ ├── app.js
│ │
│ ├── routes/
│ │ └── task.routes.js
│ │
│ ├── controllers/
│ │ └── task.controller.js
│ │
│ ├── middleware/
│ │ ├── authenticate.js
│ │ ├── validate.js
│ │ └── errorHandler.js
│ │
│ ├── schemas/
│ │ └── task.schema.js
│ │
│ ├── errors/
│ │ └── AppError.js
│ │
│ └── models/
│ └── task.model.js
│
└── package.json

The important separation is:

Route
→ decides which middleware pipeline is required

Middleware
→ handles cross-cutting request concerns

Schema
→ defines valid input

Controller
→ handles the actual request operation

AppError
→ represents expected application failures

Error Handler
→ converts errors into HTTP responses

# The Mental Model to Remember

Think of an Express API as a controlled pipeline.

                 REQUEST
                    |
        ┌─────────────────────┐
        │ Application          │
        │ Middleware           │
        └──────────┬──────────┘
                   |
        ┌─────────────────────┐
        │ Router Middleware    │
        └──────────┬──────────┘
                   |
        ┌─────────────────────┐
        │ Authentication       │
        └──────────┬──────────┘
                   |
        ┌─────────────────────┐
        │ Validation           │
        └──────────┬──────────┘
                   |
        ┌─────────────────────┐
        │ Controller           │
        └──────────┬──────────┘
                   |
        ┌─────────────────────┐
        │ Database / Service   │
        └──────────┬──────────┘
                   |
                RESPONSE

       Any stage can produce:
                   |
              next(error)
                   |
        ┌─────────────────────┐
        │ Global Error Handler│
        └──────────┬──────────┘
                   |
              ERROR RESPONSE

The key implementation rule is:

Don't make the controller responsible for everything.

Instead:

Authentication → authenticate middleware
Authorization → authorize middleware
Validation → validation middleware
Request state → res.locals
Business logic → controller/service
Expected errors → AppError
Error response → global error handler

That separation is what makes the Task Manager POC start looking like an actual backend architecture rather than a collection of routes.

# Module 4: Database Integration & Object Relational Mapping (ORM/ODM)

The main goal of this module is to understand how a Node.js application stores, retrieves, updates, and deletes real application data using a database.

Until now, our Task Manager API was using data stored directly inside Node.js memory.

For example:

```js
const tasks = [
    {
        id: 1,
        title: "Complete API documentation",
        status: "pending"
    },
    {
        id: 2,
        title: "Fix authentication bug",
        status: "completed"
    }
];
```

This works for learning API routing, but it is not real persistence.

If the Node.js server restarts:

```text
Node.js application stops
        ↓
Memory is cleared
        ↓
tasks array disappears
        ↓
Server starts again
        ↓
Data is gone
```

A database solves this problem.

```text
Client
   ↓
Express API
   ↓
Business Logic
   ↓
ORM / ODM
   ↓
Database
   ↓
Persistent Data
```

The database keeps the data even when the Node.js process restarts.

# 1. What is Database Integration?

Database integration means connecting our Node.js application to a database so that application data can be stored permanently and retrieved whenever required.

For a Task Manager application:

```text
Client
  ↓
POST /tasks
  ↓
Express
  ↓
Task Service
  ↓
ORM / ODM
  ↓
Database
  ↓
Task stored permanently
```

When the user later requests:

```text
GET /tasks
```

the application does:

```text
Client
  ↓
GET /tasks
  ↓
Express
  ↓
Task Service
  ↓
ORM / ODM
  ↓
Database
  ↓
Tasks returned
  ↓
JSON response
```

The important point is that the Node.js application does not normally store permanent application data itself.

The database is responsible for persistence.

# 2. Why We Need a Database

Using JavaScript variables for application data has several problems.

```js
const users = [];
const tasks = [];
const comments = [];
```

This data exists only while the Node.js process is running.

If the server crashes or restarts:

```text
Application memory
        ↓
    destroyed
        ↓
All data disappears
```

A database provides:

* Persistent storage
* Data querying
* Data relationships
* Indexing
* Transactions
* Concurrent access
* Data validation
* Backup and recovery
* Access control

For example:

```text
User
  ↓
Tasks
  ↓
Comments
  ↓
Attachments
```

These records can remain in the database for years.

# 3. SQL vs NoSQL

There are two major database approaches we need to understand.

```text
SQL
 ↓
Relational databases

NoSQL
 ↓
Non-relational databases
```

Common SQL databases:

* PostgreSQL
* MySQL
* MariaDB
* Microsoft SQL Server

Common NoSQL databases:

* MongoDB
* Redis
* DynamoDB
* Cassandra

The important difference is how the data is modeled and queried.

# 4. Relational Databases

A relational database stores data primarily in tables.

For example, a task management application could have:

```text
users
--------------------------------
id | name | email
--------------------------------
1  | Arun | arun@example.com
2  | Ravi | ravi@example.com
```

Another table:

```text
tasks
----------------------------------------------
id | title              | status | user_id
----------------------------------------------
1  | Fix login bug      | open   | 1
2  | Update dashboard   | done   | 1
3  | Write documentation| open   | 2
```

The `user_id` connects the task to a user.

This is called a relationship.

```text
users
  |
  | 1
  |
  | many
  ↓
tasks
```

One user can have many tasks.

# 5. What is a Row?

A row represents one record.

Example:

```text
id | title           | status
1  | Fix login bug   | open
```

This represents one task.

In JavaScript we might represent the same data as:

```js
{
    id: 1,
    title: "Fix login bug",
    status: "open"
}
```

# 6. What is a Column?

A column represents a property of the data.

For example:

```text
id
title
status
created_at
```

Each task contains values for these columns.

```text
id = 1
title = "Fix login bug"
status = "open"
```

# 7. Primary Key

A primary key uniquely identifies a record.

Example:

```text
users

id | name
1  | Arun
2  | Ravi
3  | Kumar
```

Here:

```text
id
```

is the primary key.

It allows us to identify one specific user.

For example:

```sql
SELECT * FROM users WHERE id = 2;
```

This means:

```text
Find the user whose id is 2
```

A primary key should uniquely identify a record.

# 8. Foreign Key

A foreign key connects one table to another table.

Example:

```text
users

id | name
1  | Arun
2  | Ravi
```

```text
tasks

id | title          | user_id
1  | Fix login bug  | 1
2  | Update API     | 1
3  | Write report   | 2
```

Here:

```text
tasks.user_id
```

is a foreign key referring to:

```text
users.id
```

So:

```text
Task 1 → User 1
Task 2 → User 1
Task 3 → User 2
```

# 9. Relationships in Relational Databases

The three important relationship types are:

```text
1 : 1
1 : Many
Many : Many
```

# 10. One-to-One Relationship

One record is associated with exactly one record.

Example:

```text
User
 ↓
UserProfile
```

One user has one profile.

```text
users
----------------
id | name

1  | Arun
```

```text
profiles
------------------------
id | user_id | phone

1  | 1       | 9876543210
```

Relationship:

```text
User 1 ───── 1 Profile
```

# 11. One-to-Many Relationship

One record can have many related records.

This is extremely common.

Example:

```text
User
 ↓
Tasks
```

One user can create many tasks.

```text
User
  ↓
Task 1
Task 2
Task 3
```

Database representation:

```text
users

id | name
1  | Arun
```

```text
tasks

id | title           | user_id
1  | Fix login bug   | 1
2  | Update API      | 1
3  | Add validation  | 1
```

Relationship:

```text
User 1 ───── Many Tasks
```

# 12. Many-to-Many Relationship

Many records can be connected to many other records.

Example:

```text
Users
 ↓
Projects
```

One user can work on multiple projects.

One project can contain multiple users.

```text
User A ───── Project 1
   │
   └──────── Project 2

User B ───── Project 1
   │
   └──────── Project 3
```

In a relational database, we normally create a junction table.

```text
users

id | name
1  | Arun
2  | Ravi
```

```text
projects

id | name
1  | Payment API
2  | Admin Dashboard
```

```text
project_users

user_id | project_id
1       | 1
1       | 2
2       | 1
```

The junction table represents the relationship.

```text
users
  ↓
project_users
  ↓
projects
```

# 13. Why SQL Databases Use Relationships

Relational databases are designed to keep related data structured and consistent.

Instead of storing this:

```text
task
{
    id: 1,
    title: "Fix login",
    userName: "Arun",
    userEmail: "arun@example.com"
}
```

we can separate the information:

```text
users
 ↓
user information

tasks
 ↓
task information
```

Then connect them using:

```text
user_id
```

This avoids unnecessarily duplicating the same user information across many tasks.

# 14. NoSQL Databases

NoSQL means non-relational database systems.

MongoDB is a popular NoSQL database used with Node.js.

Instead of tables and rows, MongoDB uses:

```text
Database
 ↓
Collections
 ↓
Documents
 ↓
Fields
```

MongoDB document:

```json
{
    "_id": "671...",
    "title": "Fix login bug",
    "status": "open",
    "priority": "high"
}
```

The document looks similar to a JavaScript object.

This is one reason MongoDB is popular with JavaScript applications.

# 15. SQL vs MongoDB Structure

SQL:

```text
Database
 ↓
Table
 ↓
Row
 ↓
Column
```

MongoDB:

```text
Database
 ↓
Collection
 ↓
Document
 ↓
Field
```

Example:

```text
PostgreSQL

tasks table
    ↓
rows
```

MongoDB:

```text
tasks collection
    ↓
documents
```

# 16. MongoDB Document Model

Suppose we have a task:

```json
{
    "_id": "123",
    "title": "Fix authentication bug",
    "status": "pending",
    "priority": "high"
}
```

MongoDB stores this as a document.

Multiple documents form a collection:

```text
tasks
 ├── document 1
 ├── document 2
 ├── document 3
 └── document 4
```

# 17. Embedding vs Referencing in MongoDB

MongoDB gives us two common ways to model relationships.

```text
Embedding
Referencing
```

# 18. Embedding

Related data can be stored inside the same document.

Example:

```json
{
    "_id": 101,
    "title": "Fix authentication bug",
    "comments": [
        {
            "user": "Arun",
            "message": "I found the issue"
        },
        {
            "user": "Ravi",
            "message": "I will verify the fix"
        }
    ]
}
```

Here comments are embedded inside the task document.

This can be useful when the related data is small and normally retrieved together.

# 19. Referencing

Instead of embedding the complete related document, we store its identifier.

Example:

```json
{
    "_id": 101,
    "title": "Fix authentication bug",
    "assignedTo": "user123"
}
```

The application can then retrieve the user separately.

This is useful when:

* Related data is large
* Related data is reused
* Related data changes independently
* The relationship is complex

# 20. ORM

ORM means:

```text
Object Relational Mapping
```

ORM is commonly used with relational databases.

Examples:

```text
Prisma
Sequelize
TypeORM
Drizzle
```

The ORM allows us to work with database records using programming-language objects and methods instead of writing every SQL statement manually.

Without ORM:

```sql
SELECT * FROM tasks WHERE status = 'pending';
```

With an ORM, the equivalent operation may look like:

```js
const tasks = await prisma.task.findMany({
    where: {
        status: "pending"
    }
});
```

The ORM translates the application operation into the appropriate database query.

# 21. Why ORM Exists

Without an ORM, our application may contain SQL everywhere:

```js
const result = await db.query(
    "SELECT * FROM tasks WHERE status = $1",
    ["pending"]
);
```

For a large application, database queries can become difficult to manage.

An ORM gives us:

```text
JavaScript / TypeScript
        ↓
ORM
        ↓
SQL
        ↓
PostgreSQL / MySQL
```

The ORM acts as a layer between application code and the relational database.

# 22. ORM Does Not Mean We Don't Need SQL

This is important.

Learning an ORM does NOT mean SQL is unnecessary.

If you use Prisma or Sequelize, you should still understand:

```text
SELECT
INSERT
UPDATE
DELETE
JOIN
WHERE
GROUP BY
ORDER BY
INDEXES
TRANSACTIONS
```

The ORM is an abstraction over the database.

It does not remove the database concepts.

If the ORM generates an inefficient query, we need to understand SQL well enough to identify the problem.

# 23. ODM

ODM means:

```text
Object Document Mapping
```

ODM is generally associated with document databases such as MongoDB.

The popular Node.js ODM is:

```text
Mongoose
```

The architecture becomes:

```text
Node.js
   ↓
Mongoose
   ↓
MongoDB
```

Mongoose allows us to define schemas, models, validation rules, relationships, middleware, and database operations.

# 24. ORM vs ODM

```text
ORM
 ↓
Relational databases
 ↓
Tables / Rows
 ↓
Prisma / Sequelize

ODM
 ↓
Document databases
 ↓
Collections / Documents
 ↓
Mongoose
```

Example:

```text
PostgreSQL
    ↓
Prisma
    ↓
Node.js
```

or:

```text
MongoDB
    ↓
Mongoose
    ↓
Node.js
```

# 25. Database Connection

Before the application can execute database operations, it needs a database connection.

Basic flow:

```text
Node.js starts
      ↓
Read environment variables
      ↓
Create database connection
      ↓
Database accepts connection
      ↓
Application starts accepting requests
```

We should not blindly start the server before confirming that the database is available.

A safer architecture is:

```text
Application starts
       ↓
Connect to database
       ↓
Connection successful?
      ↙ ↘
    YES  NO
     ↓    ↓
Start    Handle
server   failure
```

# 26. Environment Variables

Database credentials should not normally be hardcoded directly into source code.

Bad:

```js
const databaseUrl =
    "mongodb://admin:password123@localhost:27017/task_manager";
```

This creates security problems.

Instead:

```env
DATABASE_URL=mongodb://admin:password123@localhost:27017/task_manager
```

Then:

```js
const databaseUrl = process.env.DATABASE_URL;
```

The `.env` file should normally be excluded from Git.

```gitignore
.env
```

# 27. Why Database Connection Pooling Exists

A database connection is not completely free.

Creating a connection involves communication between the application and database server.

If every HTTP request creates a brand-new database connection:

```text
Request 1 → Create connection → Query → Close
Request 2 → Create connection → Query → Close
Request 3 → Create connection → Query → Close
```

This is inefficient.

Instead, applications normally use connection pooling.

# 28. Connection Pool

A connection pool keeps multiple database connections ready for reuse.

```text
Node.js Application
        ↓
Connection Pool
 ┌──────┼──────┐
 ↓      ↓      ↓
Conn 1  Conn 2 Conn 3
 ↓      ↓      ↓
       Database
```

Suppose 100 requests arrive.

We don't necessarily create 100 new database connections.

Instead:

```text
100 requests
      ↓
Connection Pool
      ↓
Reuse available connections
```

The exact pool behavior depends on the database driver and ORM/ODM configuration.

# 29. Why Pooling Matters

Without pooling:

```text
Request
 ↓
Create connection
 ↓
Query
 ↓
Destroy connection
```

With pooling:

```text
Request
 ↓
Borrow connection
 ↓
Query
 ↓
Return connection to pool
```

The second approach is generally much more efficient for server applications.

# 30. Pool Size

A pool may be configured with a maximum number of connections.

For example:

```text
Maximum connections = 10
```

Then:

```text
Request 1 → Connection 1
Request 2 → Connection 2
Request 3 → Connection 3
...
Request 10 → Connection 10
```

If another request arrives while all connections are busy, it may wait until one becomes available.

This prevents the application from opening an uncontrolled number of database connections.

# 31. Database Connection Events

Database libraries often expose events or callbacks related to the connection.

Common events include:

```text
connect
error
disconnect
```

For example, conceptually:

```js
database.on("connect", () => {
    console.log("Database connected");
});

database.on("error", (error) => {
    console.error("Database error:", error);
});
```

The exact API depends on the database library.

# 32. `on("connect")`

The `connect` event tells us that the database connection has been established.

Example:

```js
db.on("connect", () => {
    console.log("Database connection established");
});
```

This can be useful for:

* Logging
* Monitoring
* Startup status
* Debugging

# 33. `on("error")`

Database failures can happen because of:

```text
Wrong credentials
Database server stopped
Network failure
Connection timeout
Invalid configuration
```

An error listener allows the application to observe these failures.

Example:

```js
db.on("error", (error) => {
    console.error("Database connection error:", error);
});
```

Important:

An error listener is not a replacement for proper error handling.

We still need to decide what the application should do when the database becomes unavailable.

# 34. Schema

A schema describes the expected structure and rules for data.

In Mongoose:

```js
const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending"
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium"
    }
});
```

This tells Mongoose:

```text
title
 ↓
must be a String
 ↓
required

status
 ↓
must be one of:
pending
completed

priority
 ↓
must be:
low / medium / high
```

# 35. Schema vs Model

These two concepts are different.

Schema:

```text
Defines the structure and rules
```

Model:

```text
Provides the interface for working with database documents
```

Example:

```js
const taskSchema = new mongoose.Schema({
    title: String,
    status: String
});

const Task = mongoose.model("Task", taskSchema);
```

Here:

```text
taskSchema
    ↓
defines structure

Task
    ↓
model used to interact with MongoDB
```

# 36. CRUD Operations

Almost every backend application performs CRUD operations.

```text
C → Create
R → Read
U → Update
D → Delete
```

For a task application:

```text
POST   /tasks       → Create
GET    /tasks       → Read
PATCH  /tasks/:id   → Update
DELETE /tasks/:id   → Delete
```

The API communicates with the database through the ORM/ODM.

# 37. Create Operation

Client sends:

```http
POST /tasks
```

Request body:

```json
{
    "title": "Fix authentication bug",
    "priority": "high"
}
```

Application flow:

```text
Client
 ↓
Express
 ↓
Controller
 ↓
Service
 ↓
ORM / ODM
 ↓
Database
```

The database stores the new record.

# 38. Read Operation

Client sends:

```http
GET /tasks
```

Flow:

```text
Client
 ↓
Express
 ↓
Controller
 ↓
Service
 ↓
ORM / ODM
 ↓
Database
 ↓
Results
 ↓
JSON response
```

# 39. Update Operation

Client:

```http
PATCH /tasks/101
```

Body:

```json
{
    "status": "completed"
}
```

Flow:

```text
Request
 ↓
Find task 101
 ↓
Validate update
 ↓
Update database
 ↓
Return updated task
```

# 40. Delete Operation

Client:

```http
DELETE /tasks/101
```

Flow:

```text
Request
 ↓
Find task
 ↓
Delete record
 ↓
Return response
```

# 41. Indexes

An index helps the database find records more efficiently.

Imagine a `tasks` collection containing:

```text
10 records
```

Searching through all records may not be a problem.

But imagine:

```text
10 million records
```

and we frequently search:

```text
status = "pending"
```

Without a suitable index, the database may need to inspect many records.

An index provides a data structure that helps the database locate matching records more efficiently.

# 42. Example Index

Suppose we frequently search:

```text
tasks.status
```

We can create an index on:

```text
status
```

Conceptually:

```text
status index
     ↓
pending → records
completed → records
failed → records
```

The exact internal structure depends on the database.

# 43. Index Trade-Off

Indexes are not free.

An index can make reads faster, but indexes also:

```text
Consume storage
+
Need to be maintained
+
Can make writes more expensive
```

For example:

```text
INSERT task
```

The database may need to update relevant indexes as well.

Therefore:

```text
Do NOT index every column automatically.
```

Indexes should be based on actual query patterns.

# 44. Good Indexing Strategy

Before creating an index, ask:

```text
Which queries happen frequently?

Which fields are commonly used in:
- WHERE
- JOIN
- ORDER BY
- lookup operations
```

For example, if the application frequently performs:

```text
Find tasks for a specific user
```

then an index on:

```text
user_id
```

may be useful.

If the application frequently performs:

```text
Find tasks by status
```

then:

```text
status
```

may need an index.

# 45. Composite Index

Sometimes queries use multiple fields together.

Example:

```text
Find pending tasks belonging to user 10
```

Conceptually:

```text
user_id + status
```

A composite index can be created for such query patterns.

The exact index order matters.

For example:

```text
(user_id, status)
```

is not automatically equivalent to:

```text
(status, user_id)
```

Index design should be based on actual query patterns and database behavior.

# 46. Database Join

A join combines related records from different tables.

Suppose:

```text
users

id | name
1  | Arun
2  | Ravi
```

```text
tasks

id | title        | user_id
1  | Fix login    | 1
2  | Update API   | 2
```

We may want:

```text
Task
+
User information
```

A SQL JOIN can produce:

```text
Task title | User name
Fix login  | Arun
Update API | Ravi
```

Conceptually:

```text
tasks
   ↓
JOIN
   ↓
users
```

# 47. Population in Mongoose

MongoDB does not use SQL JOIN syntax in the same way as relational databases.

Mongoose provides:

```text
populate()
```

to resolve referenced documents.

Example schema:

```js
const taskSchema = new mongoose.Schema({
    title: String,
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});
```

The task stores:

```text
assignedTo → User ID
```

Then:

```js
const tasks = await Task.find()
    .populate("assignedTo");
```

Mongoose can retrieve the referenced user information.

Conceptually:

```text
Task
 ↓
assignedTo
 ↓
User ID
 ↓
User document
```

# 48. SQL JOIN vs Mongoose Populate

Relational database:

```text
tasks
   ↓
JOIN
   ↓
users
```

MongoDB + Mongoose:

```text
Task
   ↓
populate()
   ↓
User
```

They solve a similar application-level problem, but they work differently internally.

# 49. Transactions

A transaction groups multiple database operations into one logical unit.

Example:

```text
Transfer money
```

Suppose:

```text
Account A
₹10,000

Account B
₹5,000
```

Transfer:

```text
A → B
₹2,000
```

We need:

```text
Subtract ₹2,000 from A
+
Add ₹2,000 to B
```

If the first operation succeeds but the second fails, the database should not leave the system in an inconsistent state.

A transaction can provide:

```text
BEGIN
 ↓
Operation 1
 ↓
Operation 2
 ↓
COMMIT
```

If something fails:

```text
ROLLBACK
```

# 50. Database Constraints

Databases can enforce rules on data.

Examples:

```text
NOT NULL
UNIQUE
PRIMARY KEY
FOREIGN KEY
CHECK
```

Example:

```text
email must be unique
```

This prevents multiple users from accidentally using the same email address.

Application validation is useful, but important rules should also be enforced at the database level when appropriate.

# 51. Validation

Validation checks whether incoming data is acceptable.

Example:

```json
{
    "title": "",
    "priority": "extreme"
}
```

Our application may reject this because:

```text
title → required
priority → must be low / medium / high
```

Validation can exist at multiple levels:

```text
Client validation
      ↓
API validation
      ↓
ORM / ODM validation
      ↓
Database constraints
```

Never rely only on frontend validation.

The backend must validate incoming data.

# 52. Database Layer in a Node.js Application

A clean backend can separate responsibilities.

Example:

```text
src/
├── controllers/
├── routes/
├── services/
├── models/
├── database/
├── middleware/
└── app.js
```

Responsibilities:

```text
routes
 ↓
Decide which controller handles the request

controllers
 ↓
Handle HTTP request/response

services
 ↓
Business logic

models
 ↓
Database structure and operations

database
 ↓
Connection configuration
```

This separation becomes very important as the application grows.

# 53. Request Flow With Database

Suppose the client sends:

```http
POST /tasks
```

with:

```json
{
    "title": "Fix payment API",
    "priority": "high"
}
```

The complete flow can be:

```text
Client
  ↓
Express Router
  ↓
Controller
  ↓
Validation
  ↓
Service
  ↓
ORM / ODM
  ↓
Connection Pool
  ↓
Database
  ↓
Database result
  ↓
Service
  ↓
Controller
  ↓
HTTP Response
```

This is the architecture we are building toward.

# 54. Database Errors

Database operations can fail.

Examples:

```text
Connection refused
Authentication failed
Duplicate value
Validation error
Query timeout
Database unavailable
Network failure
```

We should not expose internal database details directly to clients.

Bad:

```json
{
    "error": "MongoServerError: E11000 duplicate key..."
}
```

Better:

```json
{
    "message": "Email address is already registered"
}
```

The server logs the technical error while the client receives an appropriate API-level response.

# 55. Connection Failure Strategy

A production application should know what happens if the database is unavailable.

Example:

```text
Node.js starts
 ↓
Database connection
 ↓
FAILED
 ↓
Log error
 ↓
Do not blindly accept requests that require database access
```

Depending on the application architecture, the process may:

```text
retry connection
+
wait before retrying
+
exit and allow process manager/container orchestration to restart it
```

The correct strategy depends on the deployment environment.

# 56. ORM/ODM Is an Abstraction, Not Magic

When we write:

```js
await Task.find({ status: "pending" });
```

Mongoose is doing more work underneath.

Conceptually:

```text
JavaScript method
       ↓
Mongoose
       ↓
MongoDB driver
       ↓
Network request
       ↓
MongoDB
       ↓
Result
       ↓
Mongoose
       ↓
JavaScript object
```

Similarly:

```js
await prisma.task.findMany(...)
```

does not directly magically access memory.

Conceptually:

```text
JavaScript
   ↓
Prisma
   ↓
Database driver
   ↓
SQL query
   ↓
PostgreSQL
   ↓
Result
   ↓
Prisma
   ↓
JavaScript result
```

Understanding this flow is important when debugging slow database operations.

# 57. SQL vs NoSQL — When to Think About Which

Relational databases are often a strong choice when:

```text
Data has strong relationships
+
Transactions are important
+
Data structure is relatively structured
+
Complex queries and joins are required
```

Examples:

```text
Banking
Accounting
ERP
Inventory
Order management
```

NoSQL databases can be useful when:

```text
Document-oriented data fits naturally
+
Schema flexibility is useful
+
Data is commonly retrieved as documents
+
The application benefits from document-oriented modeling
```

Examples can include:

```text
Content systems
Catalog-style applications
Certain real-time applications
Rapidly changing document structures
```

There is no universal rule that:

```text
SQL = good
NoSQL = bad
```

or:

```text
NoSQL = modern
SQL = old
```

Both are tools for different data-modeling requirements.

# 58. Important Interview Understanding

If someone asks:

"Why would you choose PostgreSQL instead of MongoDB?"

Do not answer:

```text
PostgreSQL is better.
```

That is a weak answer.

Think about the application's data.

For example:

```text
An order management system
```

may contain:

```text
Customer
 ↓
Orders
 ↓
Order Items
 ↓
Products
 ↓
Payments
```

There are strong relationships and transactional requirements.

A relational database may be a strong fit.

For a document-oriented application where records are naturally stored and retrieved as documents, MongoDB may be a good fit.

The database should be selected based on:

```text
Data model
+
Query patterns
+
Consistency requirements
+
Transaction requirements
+
Scaling requirements
+
Operational requirements
```

# 59. Module 4 Architecture

By the end of this module, our application should move from:

```text
Express
 ↓
In-memory array
```

to:

```text
Express
 ↓
Controller
 ↓
Service
 ↓
ORM / ODM
 ↓
Connection Pool
 ↓
Database
```

Example:

```text
POST /tasks
       ↓
Task Controller
       ↓
Task Service
       ↓
Mongoose / Prisma
       ↓
Database
       ↓
Persistent Task
```

# 60. What I Need to Be Comfortable With After Module 4

I should understand:

```text
SQL vs NoSQL
```

```text
Tables vs Collections
```

```text
Rows vs Documents
```

```text
Primary Key vs Document ID
```

```text
Foreign Keys
```

```text
1:1 relationships
```

```text
1:Many relationships
```

```text
Many:Many relationships
```

```text
Embedding vs Referencing
```

```text
ORM
```

```text
ODM
```

```text
Schema
```

```text
Model
```

```text
CRUD
```

```text
Database connection
```

```text
Connection pooling
```

```text
Database events
```

```text
Indexes
```

```text
Joins
```

```text
Mongoose populate
```

```text
Transactions
```

```text
Validation
```

```text
Database error handling
```

# 61. Module 4 Practical Project

For this module, we should upgrade the Task Manager API from memory-based storage to a real database.

Current:

```text
Task Manager API
       ↓
JavaScript array
```

New:

```text
Task Manager API
       ↓
Express
       ↓
Service layer
       ↓
Mongoose / Prisma
       ↓
Database
```

The API should support:

```text
POST   /tasks
GET    /tasks
GET    /tasks/:id
PATCH  /tasks/:id
DELETE /tasks/:id
```

And nested resources:

```text
GET    /tasks/:id/comments
POST   /tasks/:id/comments
PATCH  /tasks/:id/comments/:commentId
DELETE /tasks/:id/comments/:commentId
```

Data model:

```text
User
 ↓
Many Tasks
 ↓
Many Comments
```

Possible structure:

```text
User
 ├── id
 ├── name
 └── email

Task
 ├── id
 ├── title
 ├── description
 ├── status
 ├── priority
 ├── userId
 └── createdAt

Comment
 ├── id
 ├── taskId
 ├── userId
 ├── message
 └── createdAt
```

The important goal is not just to make CRUD work.

I should understand what happens underneath:

```text
HTTP request
 ↓
Express
 ↓
Controller
 ↓
Service
 ↓
ORM / ODM
 ↓
Connection Pool
 ↓
Database
 ↓
Query execution
 ↓
Result
 ↓
HTTP response
```

# Module 5: Advanced Authentication, Security & RBAC

Authentication and authorization are two different security responsibilities in an API.

- Authentication checks **who the requester is**.
- Authorization checks **what that authenticated requester is allowed to do**.
- A secure request normally passes through multiple layers instead of depending on one security mechanism.
- Typical flow:

  `Client → Security middleware → Authentication → Authorization → Route handler → Response`

## Password Hashing

- User passwords should never be stored directly in the database.
- Storing a password such as `Admin@123` means anyone who gets database access can immediately see the actual password.
- Password hashing converts the original password into a one-way hash.

  `Admin@123 → password hashing algorithm → $2b$12$...`

- The original password is not stored in the database.
- During login, the password entered by the user is compared against the stored hash.
- The application does not need to convert the hash back into the original password.
- Hashing is different from encryption:
  - Hashing is intended for one-way verification.
  - Encryption is designed so that encrypted data can later be decrypted with the correct key.
- Passwords normally require hashing, not encryption.
- Password hashing algorithms are intentionally slower than normal general-purpose hashes.
- A slow password hash makes large numbers of password guesses more expensive for an attacker.
- Common password hashing algorithms in Node.js applications include bcrypt and Argon2.
- Password hashing should happen on the server before the password is stored.
- The plain password should not be logged, returned in an API response, or stored in application data after it is no longer needed.

## bcrypt

- bcrypt is a password hashing algorithm commonly used in Node.js applications.
- It is designed specifically for password storage rather than general-purpose data hashing.
- bcrypt uses a configurable cost factor, often called salt rounds.
- A higher cost means more computation is required for each hash and verification operation.
- This additional computation is useful because password attacks may require trying a large number of guesses.
- Example:

```js
import bcrypt from "bcrypt";

const passwordHash = await bcrypt.hash(password, 12);
```

- The `12` represents the cost setting used for this hash.
- bcrypt also generates and handles the salt as part of its normal hashing process.
- A salt is a random value added to the password hashing process.
- Different users can therefore have different hashes even when they use the same password.
- Password verification is performed using `bcrypt.compare()`.

```js
const isPasswordValid = await bcrypt.compare(
  password,
  user.passwordHash
);
```

- `true` means the entered password matches the stored hash.
- `false` means the password is incorrect.
- The application should store the result of `bcrypt.hash()` in a field such as `passwordHash`.
- The original password should never be stored beside it.
- bcrypt is used mainly during:
  - User registration
  - Password changes
  - Password reset flows
  - Login verification

## Argon2

- Argon2 is another password hashing algorithm designed to make password cracking expensive.
- Argon2 can deliberately use CPU and memory resources during hashing.
- This makes large-scale password guessing more expensive for attackers.
- Argon2 is commonly considered a modern choice for password hashing.
- Example:

```js
import argon2 from "argon2";

const passwordHash = await argon2.hash(password);
```

- Password verification:

```js
const isPasswordValid = await argon2.verify(
  user.passwordHash,
  password
);
```

- bcrypt and Argon2 solve the same general problem: securely storing passwords so the original password is not stored.
- A project should normally choose one suitable password hashing algorithm rather than hashing the same password with several algorithms unnecessarily.
- For the practice project, bcrypt can be used to understand the complete registration and login flow.

## Password Hashing Flow

- Registration starts with the plain password sent over an HTTPS connection.
- The server receives the password.
- The server validates the input.
- The server passes the password to bcrypt or Argon2.
- The hashing algorithm generates a password hash.
- Only the hash is stored.

```text
Client
  ↓
password: "Admin@123"
  ↓
Server
  ↓
bcrypt.hash()
  ↓
passwordHash
  ↓
Database
```

- Login follows a different path.
- The user sends the email and password.
- The server finds the user record.
- The server retrieves the stored password hash.
- `bcrypt.compare()` checks the supplied password against that hash.
- If the comparison succeeds, authentication can continue.
- If the comparison fails, the server rejects the login.

```text
Client
  ↓
email + password
  ↓
Find user
  ↓
bcrypt.compare()
  ↓
Password matches?
  ├── No  → 401
  └── Yes → Create access token
```

## User Record

- A user record should contain information needed for authentication and authorization.
- Example:

```js
{
  id: "u101",
  name: "Gowtham",
  email: "gowtham@example.com",
  passwordHash: "$2b$12$...",
  role: "user"
}
```

- `id` identifies the user.
- `email` can be used as the login identifier.
- `passwordHash` contains the hashed password.
- `role` identifies the user's authorization role.
- The password itself should not exist in the stored user object.
- The API response should also avoid returning `passwordHash`.

## Registration

- Registration creates a new user account.
- A typical endpoint is:

```text
POST /api/v1/auth/register
```

- Example request:

```json
{
  "name": "Gowtham",
  "email": "gowtham@example.com",
  "password": "StrongPassword@123"
}
```

- The server should not immediately insert this request into the database.
- The registration process normally performs these steps:
  - Validate required fields.
  - Validate email format.
  - Validate password requirements.
  - Check whether the email is already registered.
  - Hash the password.
  - Create the user record.
  - Assign the appropriate default role.
  - Store the user.
  - Return safe user information.
- A normal registration endpoint should not allow the client to choose `admin` as the role.
- Otherwise, a requester could attempt:

```json
{
  "name": "Attacker",
  "email": "attacker@example.com",
  "password": "Password123",
  "role": "admin"
}
```

- The server should decide the initial role.

```js
const user = {
  id: crypto.randomUUID(),
  name,
  email,
  passwordHash,
  role: "user"
};
```

- Admin users should normally be created through a controlled administrative process, seed process, database operation, or separate protected workflow.

## Login

- Login verifies the identity of an existing user.
- A typical endpoint is:

```text
POST /api/v1/auth/login
```

- Example request:

```json
{
  "email": "admin@example.com",
  "password": "Admin@123"
}
```

- Login normally performs these steps:
  - Read email and password.
  - Find the user using the email.
  - Compare the supplied password with the stored password hash.
  - Reject the request if the credentials are invalid.
  - Create a signed access token if the credentials are valid.
  - Return the access token to the client.
- A useful security practice is returning the same general error for an unknown email and a wrong password.

```json
{
  "message": "Invalid email or password"
}
```

- This reduces unnecessary information about which accounts exist.

## JSON Web Token (JWT)

- JWT is a token format commonly used to represent authenticated information between a client and server.
- A JWT is commonly used for stateless authentication.
- After successful login, the server creates a signed token.
- The client sends that token with later protected requests.
- The server verifies the token instead of requiring the user to send the password on every request.
- A JWT normally has three sections:

```text
Header.Payload.Signature
```

- The three sections are separated by dots.
- Example structure:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
.
eyJzdWIiOiJ1MTAxIiwicm9sZSI6ImFkbWluIn0
.
signature
```

- JWT is useful for APIs because the server can validate the token and obtain the user identity from the token claims.
- JWT itself does not automatically make the payload secret.
- The payload is encoded, not normally encrypted.
- Sensitive information such as passwords, credit-card details, or private secrets should not be placed inside a normal signed JWT.

## JWT Header

- The JWT header describes the token.
- A typical header contains:

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

- `alg` identifies the signing algorithm.
- `typ` identifies the token type.
- The header becomes part of the signed token.
- The application should explicitly configure and validate the algorithms appropriate for its authentication design rather than blindly accepting unexpected algorithms.

## JWT Payload

- The payload contains claims about the token.
- Example:

```json
{
  "sub": "u102",
  "role": "admin"
}
```

- `sub` means subject and is commonly used for the user's unique ID.
- `role` is an application-specific claim used for authorization in this practice project.
- Standard claims can include:
  - `sub` → subject/user identifier
  - `iat` → issued-at time
  - `exp` → expiration time
  - `iss` → issuer
  - `aud` → intended audience
- A token should contain only information needed by the authentication system.
- Keeping the payload small reduces unnecessary data being transmitted with every request.
- The client can read the encoded payload, so the payload must not be treated as a secure place for secrets.

## JWT Signature

- The signature allows the server to detect whether the token has been modified.
- With a symmetric signing algorithm such as HS256, the server uses a secret key to sign the token.
- Conceptually:

```text
Header + Payload + Secret
        ↓
     Signature
```

- When a request arrives, the server verifies the token using the appropriate verification key.
- If the payload was modified, the signature no longer matches.
- Example:

```text
Original:
role = user

Modified:
role = admin
```

- The attacker cannot simply change the payload and create a valid signature without the signing key.
- JWT verification therefore provides integrity and authenticity of the signed claims.
- JWT signing does not mean the payload is encrypted.

## JWT Secret Key

- The JWT signing secret is a sensitive server-side value.
- It should not be committed to Git.
- It should not be written directly into source code.
- Example `.env`:

```env
JWT_SECRET=long-random-secret-value
JWT_EXPIRES_IN=15m
```

- Application code can read it through `process.env`.

```js
const JWT_SECRET = process.env.JWT_SECRET;
```

- `.env` should be included in `.gitignore`.

```text
.env
node_modules/
```

- A production environment should store secrets using the deployment platform's secret/environment configuration or a dedicated secret-management system.
- If the signing secret is exposed, an attacker may be able to create valid tokens, so secret protection is critical.

## JWT Expiration

- Access tokens should normally have a limited lifetime.
- Example:

```js
const token = jwt.sign(
  {
    sub: user.id,
    role: user.role
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "15m"
  }
);
```

- `expiresIn` adds an expiration time to the token.
- After the expiration time, `jwt.verify()` rejects the token.
- Short-lived access tokens reduce the useful lifetime of a stolen token.
- A token with no expiration can remain usable indefinitely unless another mechanism invalidates it.
- Common access-token lifetimes can be measured in minutes rather than days.
- The correct lifetime depends on the application's security requirements.
- A real system may also use refresh tokens when users need longer sessions without making access tokens long-lived.

## Stateless Authentication

- JWT-based authentication can be stateless because the server does not need to keep a server-side session object for every access token.
- The token contains signed claims such as the user ID and role.
- Every protected request carries the token.
- The server verifies the token and obtains the identity information from it.

```text
Login
  ↓
Server creates JWT
  ↓
Client stores token
  ↓
Request 1 → JWT → verify
Request 2 → JWT → verify
Request 3 → JWT → verify
```

- The server does not need to look up a session record for every request just to determine whether the token itself is valid.
- Stateless does not mean "no database is ever used."
- The application can still query the database for user details, permissions, product ownership, account status, or other business data.
- Stateless JWT authentication mainly means the authentication state is carried by the signed token instead of a server-side session object.

## Access Token

- An access token represents permission to access protected API resources for a limited period.
- A login endpoint can return:

```json
{
  "accessToken": "eyJhbGciOi..."
}
```

- The client sends the token with protected requests.

```http
Authorization: Bearer eyJhbGciOi...
```

- The token should be treated as sensitive because possession of a valid token may allow access to the associated account.
- Access tokens should have an appropriate expiration time.
- Token storage on browser applications requires careful consideration because token theft can result in account compromise.

## Authorization Header

- Protected API requests commonly send JWT access tokens through the HTTP `Authorization` header.
- Standard format:

```http
Authorization: Bearer <access-token>
```

- `Bearer` indicates that possession of the token is being used as the credential.
- The server reads:

```js
const authHeader = req.headers.authorization;
```

- The header is then split into its scheme and token.

```js
const [scheme, token] = authHeader.split(" ");
```

- The server should confirm that the scheme is `Bearer` and that a token exists.
- Missing or malformed authentication headers should result in an authentication failure.

## JWT Authentication Middleware

- Authentication middleware runs before protected route handlers.
- Its responsibility is to determine whether the request contains a valid access token.
- Typical process:

```text
Request
  ↓
Read Authorization header
  ↓
Check Bearer format
  ↓
Extract token
  ↓
Verify signature
  ↓
Check expiration and claims
  ↓
Attach verified payload to req.user
  ↓
next()
```

- Example:

```js
import jwt from "jsonwebtoken";

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      message: "Authentication required"
    });
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      message: "Invalid authorization format"
    });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = payload;

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}
```

- `jwt.verify()` performs signature and registered-claim verification.
- If verification succeeds, the decoded verified payload can be attached to `req.user`.
- Route handlers can then use `req.user.sub` to identify the authenticated user.
- Route handlers can use `req.user.role` for the authorization decision.
- If verification fails, `next()` should not be called.
- This prevents unauthenticated requests from reaching the protected route handler.

## JWT Verification vs JWT Decryption

- JWT authentication is commonly described as token verification, not token decryption.
- A signed JWT payload can be decoded without the signing secret.
- The signing secret is required to verify that the token was actually signed by the trusted server and has not been modified.
- `jwt.verify()` checks the token's signature and relevant claims.
- Therefore:

```text
Decode → read encoded payload
Verify → prove the token is valid and trusted
Decrypt → recover encrypted data
```

- A normal signed JWT does not perform encryption of its payload.

## Role-Based Access Control (RBAC)

- RBAC stands for Role-Based Access Control.
- RBAC assigns permissions based on roles rather than writing separate authorization logic for every individual user.
- Example roles:

```text
user
manager
admin
```

- Example permissions:

```text
user
→ view products

manager
→ view products
→ create products
→ update products

admin
→ view products
→ create products
→ update products
→ delete products
```

- RBAC is useful when many users share the same permission rules.
- Instead of checking whether a particular email address is allowed to delete a product, the application checks the user's role.
- Example:

```js
if (req.user.role === "admin") {
  // allow deletion
}
```

- A reusable middleware is better than repeating this condition in every route.

## Authorization Middleware

- Authorization middleware runs after authentication.
- Authentication establishes a trusted identity.
- Authorization uses that identity to decide whether the requested operation is allowed.
- Example middleware:

```js
export function requireRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required"
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        message: "Insufficient permissions"
      });
    }

    next();
  };
}
```

- `requireRole("admin")` creates an authorization middleware that only allows admin users.
- Example route:

```js
router.delete(
  "/products/:id",
  authenticateToken,
  requireRole("admin"),
  deleteProduct
);
```

- The middleware order matters.
- `authenticateToken` must run first because `requireRole()` needs `req.user`.
- If authentication fails, the request stops before authorization.
- If authentication succeeds but the role is not allowed, the request stops with `403`.

## 401 Unauthorized vs 403 Forbidden

- `401 Unauthorized` is used when the request has not been successfully authenticated.
- Common examples:
  - No access token.
  - Malformed access token.
  - Invalid signature.
  - Expired token.
  - Invalid login credentials.
- `403 Forbidden` is used when authentication succeeded but the authenticated user is not allowed to perform the operation.
- Example:

```text
No token
→ 401

Invalid token
→ 401

Valid token + role=user
→ 403 for admin-only operation

Valid token + role=admin
→ operation allowed
```

- Keeping these responses conceptually separate makes the API behavior easier to understand and debug.

## Admin-Only Product Deletion

- Product deletion is a useful RBAC example because it represents a destructive operation.
- Route:

```text
DELETE /api/v1/products/:id
```

- The route should not directly trust a role supplied by the client.
- The role should come from authenticated server-verified information.

```text
Client
  ↓
Authorization: Bearer <token>
  ↓
JWT verification
  ↓
req.user = verified payload
  ↓
role check
  ↓
Product deletion
```

- Example:

```js
router.delete(
  "/products/:id",
  authenticateToken,
  requireRole("admin"),
  deleteProduct
);
```

- A normal user with a valid token reaches the authorization middleware but receives `403`.
- An admin with a valid token passes authorization and reaches the product deletion handler.
- A request without a valid token receives `401` before the role check.

## Do Not Trust Client-Supplied Roles

- A role sent in the request body is controlled by the client.

```json
{
  "role": "admin"
}
```

- Using this value for authorization would allow the client to claim an administrator role.
- This is incorrect:

```js
if (req.body.role === "admin") {
  deleteProduct();
}
```

- The role must come from trusted server-side authentication data.
- With JWT authentication, the role can be included in the signed token.

```js
const token = jwt.sign(
  {
    sub: user.id,
    role: user.role
  },
  process.env.JWT_SECRET,
  {
    expiresIn: "15m"
  }
);
```

- After verification:

```js
req.user.role
```

can be used by authorization middleware.
- The token's role is still only trustworthy after the signature has been successfully verified.

## Helmet

- Helmet is an Express middleware package that configures security-related HTTP response headers.
- Install:

```bash
npm install helmet
```

- Usage:

```js
import helmet from "helmet";

app.use(helmet());
```

- Security headers provide browser-level protections and safer defaults for HTTP behavior.
- Depending on configuration and version, Helmet can configure headers such as:
  - Content-Security-Policy
  - X-Content-Type-Options
  - Referrer-Policy
  - Strict-Transport-Security
  - X-Frame-Options
- These headers address different browser security concerns.
- Helmet does not authenticate users.
- Helmet does not authorize users.
- Helmet does not hash passwords.
- Helmet does not replace input validation.
- Helmet is one security layer inside the application.

## CORS

- CORS stands for Cross-Origin Resource Sharing.
- Browsers normally restrict JavaScript from making certain requests to a different origin.
- An origin consists of the scheme, host, and port.
- Example frontend:

```text
http://localhost:5173
```

- Example backend:

```text
http://localhost:3000
```

- These are different origins because the ports are different.
- CORS allows the backend to specify which browser origins are permitted to make cross-origin requests.
- Install:

```bash
npm install cors
```

- Basic configuration:

```js
import cors from "cors";

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);
```

- The backend can allow a known list of origins:

```js
const allowedOrigins = [
  "http://localhost:5173",
  "https://app.example.com"
];

app.use(
  cors({
    origin: allowedOrigins
  })
);
```

- CORS is mainly a browser security mechanism.
- CORS does not authenticate API users.
- CORS does not prevent Postman from sending requests.
- CORS does not prevent curl from sending requests.
- CORS does not replace JWT authentication.
- Authentication answers whether a requester is allowed to use protected resources.
- CORS answers whether a browser origin is allowed to make a cross-origin request.

## CORS Whitelisting

- A CORS whitelist contains origins that are intentionally allowed to access the API from browser-based frontend code.
- Example:

```js
const allowedOrigins = [
  "http://localhost:5173",
  "https://app.example.com"
];
```

- An unknown browser origin should not automatically be trusted.
- A dynamic CORS check can be used when more control is required:

```js
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Origin not allowed")
      );
    }
  })
);
```

- The exact policy depends on the application architecture.
- A public API and an internal company application may require different CORS policies.

## express-rate-limit

- Rate limiting restricts how many requests can be made during a defined time window.
- It helps reduce automated abuse such as repeated login attempts.
- Install:

```bash
npm install express-rate-limit
```

- Example:

```js
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    message: "Too many login attempts. Try again later."
  }
});
```

- The configuration means that the login endpoint is limited according to the configured request count and time window.
- Apply the limiter to the login route:

```js
app.post(
  "/api/v1/auth/login",
  loginLimiter,
  loginHandler
);
```

- Rate limiting is useful for:
  - Login endpoints
  - Registration endpoints
  - Password reset endpoints
  - OTP endpoints
  - Expensive API operations
  - Public APIs
- Login endpoints are especially important because attackers can repeatedly attempt passwords.
- A rate limiter does not make a password secure by itself.
- Password hashing and rate limiting solve different problems:
  - Password hashing protects stored passwords.
  - Rate limiting reduces the speed of repeated online attempts.
- A rate limiter can return:

```text
429 Too Many Requests
```

when the configured limit is exceeded.

## Complete Security Middleware Setup

- Security middleware can be registered near the beginning of the Express application.

```js
import express from "express";
import helmet from "helmet";
import cors from "cors";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN
  })
);

app.use(express.json());
```

- Each middleware has a different responsibility:

```text
helmet
→ security-related HTTP headers

cors
→ browser cross-origin policy

express.json()
→ parse JSON request bodies

authenticateToken
→ verify user identity

requireRole()
→ check authorization
```

- No single middleware provides complete API security.

## Environment Variables

- Environment variables keep configuration and secrets outside the source code.
- Example:

```env
PORT=3000
JWT_SECRET=long-random-secret
JWT_EXPIRES_IN=15m
CLIENT_ORIGIN=http://localhost:5173
```

- Load them using:

```js
import "dotenv/config";
```

- Access them with:

```js
process.env.JWT_SECRET
process.env.JWT_EXPIRES_IN
process.env.CLIENT_ORIGIN
```

- Environment variables are useful for values that change between environments.
- Development, testing, staging, and production can have different JWT secrets and frontend origins.
- `.env` should not be committed when it contains secrets.

## Authentication Module Project Structure

```text
Module3/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── product.controller.js
│   ├── data/
│   │   ├── users.js
│   │   └── products.js
│   ├── middleware/
│   │   ├── authenticateToken.js
│   │   ├── requireRole.js
│   │   └── rateLimiters.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── product.routes.js
│   └── utils/
│       └── jwt.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

- A small POC can initially keep fewer files.
- The separation becomes useful when authentication, authorization, and product logic grow.
- Middleware should contain reusable request checks.
- Controllers should handle request and response logic.
- Routes should mainly define URL-to-handler relationships.
- Utility code such as token creation can be isolated so JWT configuration does not get duplicated.

## POC API

- Authentication routes:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
```

- Product routes:

```text
GET /api/v1/products
POST /api/v1/products
DELETE /api/v1/products/:id
```

- Access policy:

```text
POST /auth/register
→ public

POST /auth/login
→ public + rate limited

GET /products
→ authenticated users

POST /products
→ authenticated users

DELETE /products/:id
→ authenticated admin users
```

## Register Implementation Flow

```js
app.post("/api/v1/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required"
    });
  }

  const existingUser = users.find(
    (user) => user.email === email
  );

  if (existingUser) {
    return res.status(409).json({
      message: "Email already registered"
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    role: "user"
  };

  users.push(user);

  return res.status(201).json({
    message: "User registered successfully",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});
```

- The password is hashed before the user is stored.
- The response returns safe fields only.
- The `passwordHash` is not returned.
- The role is assigned by the server.
- Duplicate emails are rejected before creating another account.

## Login Implementation Flow

```js
app.post("/api/v1/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = users.find(
    (user) => user.email === email
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password"
    });
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid email or password"
    });
  }

  const accessToken = jwt.sign(
    {
      sub: user.id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN
    }
  );

  return res.status(200).json({
    message: "Login successful",
    accessToken
  });
});
```

- Login does not return the password.
- Login does not return the password hash.
- The JWT contains the minimum identity information needed for the practice authorization flow.
- The token is signed using the server-side secret.
- The token receives an expiration time.

## Protected Product Route

```js
router.delete(
  "/products/:id",
  authenticateToken,
  requireRole("admin"),
  deleteProduct
);
```

- Express executes middleware from left to right.
- `authenticateToken` runs first.
- If the token is invalid, the request stops.
- If authentication succeeds, `req.user` is created.
- `requireRole("admin")` then checks the verified role.
- If the role is not `admin`, the request stops with `403`.
- Only after both checks pass does `deleteProduct` execute.

## Complete Request 

- Registering a normal user:

```text
POST /api/v1/auth/register

{
  "name": "Gowtham",
  "email": "gowtham@example.com",
  "password": "StrongPassword@123"
}
```

Expected:

```text
201 Created
```

- Logging in:

```text
POST /api/v1/auth/login

{
  "email": "gowtham@example.com",
  "password": "StrongPassword@123"
}
```

Expected:

```text
200 OK
accessToken returned
```

- Requesting a protected endpoint without a token:

```text
GET /api/v1/products
```

Expected:

```text
401 Unauthorized
```

- Requesting a protected endpoint with a valid user token:

```text
GET /api/v1/products
Authorization: Bearer <user-token>
```

Expected:

```text
200 OK
```

- Deleting a product with a normal user token:

```text
DELETE /api/v1/products/p101
Authorization: Bearer <user-token>
```

Expected:

```text
403 Forbidden
```

- Deleting a product with an admin token:

```text
DELETE /api/v1/products/p101
Authorization: Bearer <admin-token>
```

Expected:

```text
200 OK
```

- Sending an expired token:

```text
DELETE /api/v1/products/p101
Authorization: Bearer <expired-token>
```

Expected:

```text
401 Unauthorized
```

- Sending too many login requests:

```text
POST /api/v1/auth/login
```

Expected after the configured limit:

```text
429 Too Many Requests
```

## Security Rules for the Practice Project

- Never store plain-text passwords.
- Never return passwords in API responses.
- Never return password hashes in normal user responses.
- Never hardcode JWT secrets in source code.
- Never commit `.env` files containing secrets.
- Always give access tokens an expiration time.
- Always verify the JWT before using its claims.
- Never use `req.body.role` as the source of authorization.
- Use authenticated server-verified information for role checks.
- Keep authentication and authorization as separate middleware responsibilities.
- Use `401` when authentication has failed.
- Use `403` when authentication succeeded but permission is insufficient.
- Apply rate limiting to sensitive endpoints such as login.
- Configure CORS according to known frontend origins instead of treating CORS as authentication.
- Use Helmet as an additional HTTP security layer.
- Use HTTPS in real deployments so passwords and tokens are protected while traveling between client and server.
- Avoid logging access tokens, passwords, or other authentication secrets.
- Keep JWT payloads small and avoid placing sensitive information inside them.
- Do not assume a valid JWT means the user has permission for every operation.
- Authentication and authorization are separate checks.

## Final Request Flow

```text
REGISTER
Client
  ↓
POST /register
  ↓
Validate input
  ↓
Check existing user
  ↓
Hash password
  ↓
Store passwordHash
  ↓
Create user
```

```text
LOGIN
Client
  ↓
POST /login
  ↓
Find user
  ↓
bcrypt.compare()
  ↓
Password valid
  ↓
jwt.sign()
  ↓
Access token
  ↓
Client
```

```text
PROTECTED REQUEST
Client
  ↓
Authorization: Bearer <token>
  ↓
authenticateToken
  ↓
jwt.verify()
  ↓
req.user = verified payload
  ↓
requireRole("admin")
  ↓
Permission check
  ↓
Controller
  ↓
Database / business operation
  ↓
Response
```

```text
NORMAL USER DELETE REQUEST
DELETE /products/:id
  ↓
JWT valid
  ↓
req.user.role = user
  ↓
requireRole("admin")
  ↓
403 Forbidden
```

```text
ADMIN DELETE REQUEST
DELETE /products/:id
  ↓
JWT valid
  ↓
req.user.role = admin
  ↓
requireRole("admin")
  ↓
deleteProduct()
  ↓
200 OK
```

Yes. The easiest way is to give the **entire note as one single Markdown code block**, so there are no separate pieces to copy.

The previous answer was split because I was trying to keep the chat readable. For your actual `.md` file, copy everything between the opening and closing ``` below into:

`Module_6_Testing_Caching_Production_Deployment.md`

````md
# Module 6: Testing, Caching, & Production Deployment

Verify the application automatically, improve repeated data retrieval using caching, manage multiple Node.js processes, and deploy the application into a production environment.

The main topics covered in this module:

* Automated API testing using Node.js Test Runner or Jest with Supertest
* Redis caching for expensive or frequently repeated database queries
* PM2 process management
* PM2 cluster mode and multi-core processing
* Production environment configuration
* Production logging
* Cloud deployment and deployment pipelines
* Health checks and production monitoring
* Performance verification

The practice application used throughout this module is a Task Manager API.

```text
Client
|
Express API
|
|-- Automated Tests
|
|-- MongoDB
|
|-- Redis Cache
|
|-- PM2
|
Production Cloud Infrastructure
````

# 1. Automated Endpoint Testing

Automated endpoint testing verifies that API endpoints continue to behave correctly after code changes.

Manual testing through Postman is useful during development, but it becomes difficult when the API contains many endpoints.

For example, a Task Manager API may contain:

```text
POST   /api/v1/tasks
GET    /api/v1/tasks
GET    /api/v1/tasks/:id
PATCH  /api/v1/tasks/:id
DELETE /api/v1/tasks/:id
```

Checking all of these manually after every change takes time and can easily miss an existing bug.

Automated tests allow the same API behavior to be checked repeatedly with a single command.

```text
Code change
|
Run tests
|
All tests pass
|
Existing API behavior is still working
```

A test should verify application behavior rather than only checking whether a function was called.

For an API, important things to verify include:

* HTTP status code
* Response body
* Response structure
* Request validation
* Query parameters
* Route parameters
* Authentication
* Authorization
* Error responses
* Database behavior
* Important business rules

## Jest and Supertest

Jest is a JavaScript testing framework.

Supertest is useful for sending HTTP-style requests to an Express application during testing.

For example:

```js
const request = require("supertest");
const app = require("../src/app");

const response = await request(app)
    .get("/api/v1/tasks")
    .expect(200);
```

Supertest sends a request to the Express application and provides the response for assertions.

The Express application does not need to be manually started through `app.listen()` for this type of test.

## Separating app.js and server.js

A useful Express structure is:

```text
src/
|
|-- app.js
|-- server.js
|-- routes/
|-- controllers/
|-- models/
```

`app.js` creates the Express application:

```js
const express = require("express");

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok"
    });
});

module.exports = app;
```

`server.js` starts the HTTP server:

```js
const app = require("./app");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
```

This separation is important for testing.

The test can import:

```js
const app = require("../src/app");
```

without automatically opening a real server port.

If `app.listen()` is directly executed while importing the application, tests can create unnecessary server processes and port conflicts.

## Installing Jest and Supertest

```bash
npm install --save-dev jest supertest
```

Example `package.json`:

```json
{
    "scripts": {
        "dev": "nodemon src/server.js",
        "start": "node src/server.js",
        "test": "jest --runInBand"
    }
}
```

`npm test` can then execute the complete test suite.

## Basic GET endpoint test

Example endpoint:

```js
app.get("/api/v1/tasks", async (req, res) => {
    const tasks = [
        {
            id: "1",
            title: "Fix payment issue",
            priority: "high"
        },
        {
            id: "2",
            title: "Update dashboard",
            priority: "medium"
        }
    ];

    res.status(200).json(tasks);
});
```

Test:

```js
const request = require("supertest");
const app = require("../src/app");

describe("GET /api/v1/tasks", () => {
    test("should return all tasks", async () => {
        const response = await request(app)
            .get("/api/v1/tasks")
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
    });
});
```

The test verifies:

```text
GET request
|
Endpoint executes
|
HTTP status = 200
|
Response is an array
|
Two tasks are returned
```

## Testing response properties

Suppose the API returns:

```json
{
    "id": "123",
    "title": "Fix payment issue",
    "priority": "high"
}
```

The test can verify specific properties:

```js
expect(response.body).toHaveProperty("id");
expect(response.body).toHaveProperty("title");
expect(response.body.priority).toBe("high");
```

This protects the API response contract.

For example, if a future change accidentally removes `priority`, the test fails.

## Testing POST requests

POST requests can send JSON using `.send()`.

Example:

```js
test("should create a new task", async () => {
    const response = await request(app)
        .post("/api/v1/tasks")
        .send({
            title: "Prepare deployment",
            priority: "high"
        })
        .expect(201);

    expect(response.body).toHaveProperty("_id");
    expect(response.body.title).toBe("Prepare deployment");
    expect(response.body.priority).toBe("high");
});
```

The test checks the complete request-response behavior.

```text
POST request
|
JSON body
|
Validation
|
Database creation
|
201 response
|
Created task returned
```

## Testing validation errors

Suppose `title` is required:

```js
app.post("/api/v1/tasks", async (req, res) => {
    if (!req.body.title) {
        return res.status(400).json({
            message: "Title is required"
        });
    }

    // Create task
});
```

Test:

```js
test("should reject task without title", async () => {
    const response = await request(app)
        .post("/api/v1/tasks")
        .send({
            priority: "high"
        })
        .expect(400);

    expect(response.body.message).toBe("Title is required");
});
```

Testing invalid requests is important because production applications receive invalid and unexpected input regularly.

## Testing route parameters

Example:

```text
GET /api/v1/tasks/123
```

Route:

```js
app.get("/api/v1/tasks/:id", async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
        return res.status(404).json({
            message: "Task not found"
        });
    }

    res.status(200).json(task);
});
```

Test:

```js
test("should return task by id", async () => {
    const response = await request(app)
        .get(`/api/v1/tasks/${taskId}`)
        .expect(200);

    expect(response.body).toHaveProperty("_id");
});
```

Not-found behavior should also be tested:

```js
test("should return 404 when task does not exist", async () => {
    const response = await request(app)
        .get("/api/v1/tasks/65ffffffffffffffffffffff")
        .expect(404);

    expect(response.body.message).toBe("Task not found");
});
```

A successful request and a failure request are both part of the endpoint contract.

## Testing query parameters

Example:

```text
GET /api/v1/tasks?priority=high
```

Test:

```js
test("should filter tasks by priority", async () => {
    const response = await request(app)
        .get("/api/v1/tasks")
        .query({
            priority: "high"
        })
        .expect(200);

    expect(
        response.body.every(task => task.priority === "high")
    ).toBe(true);
});
```

`.query()` creates the query string.

It is cleaner than manually constructing:

```text
/api/v1/tasks?priority=high
```

inside every test.

## Testing authentication

Authenticated endpoints can send headers:

```js
const response = await request(app)
    .get("/api/v1/tasks")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);
```

Important authentication tests include:

```text
No token
|
401 Unauthorized

Invalid token
|
401 Unauthorized

Valid token
|
200 OK
```

Authorization can also be tested:

```text
Authenticated but insufficient permission
|
403 Forbidden
```

## Testing the Node.js native test runner

Node.js provides a built-in test runner through `node:test`.

Example:

```js
const test = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const app = require("../src/app");

test("GET /health should return ok", async () => {
    const response = await request(app)
        .get("/health")
        .expect(200);

    assert.strictEqual(response.body.status, "ok");
});
```

The native test runner is useful when a project does not need the larger Jest ecosystem.

Jest provides additional testing features and a familiar assertion and mocking structure.

The important part is not the framework name.

The important part is having repeatable automated tests that verify actual application behavior.

## Database tests

Database-backed API tests need controlled test data.

A common lifecycle is:

```text
beforeAll
|
Connect to test database

beforeEach
|
Prepare required test data

test
|
Execute endpoint

afterAll
|
Close database connection
```

Example:

```js
beforeAll(async () => {
    await connectTestDatabase();
});

beforeEach(async () => {
    await Task.deleteMany({});
});

afterAll(async () => {
    await disconnectTestDatabase();
});
```

A separate test database should be used.

The production database should never be used for automated tests because tests intentionally create, update and delete data.

## Important API test cases

For the Task Manager API:

```text
POST /tasks
|
Valid task -> 201
Missing title -> 400
Invalid priority -> 400

GET /tasks
|
All tasks -> 200
Priority filter -> 200
No matching tasks -> 200 with []

GET /tasks/:id
|
Existing task -> 200
Missing task -> 404

PATCH /tasks/:id
|
Valid update -> 200
Invalid update -> 400
Missing task -> 404

DELETE /tasks/:id
|
Existing task -> 204
Missing task -> 404
```

The goal is not to create meaningless tests for every line.

The goal is to protect important application behavior from regression.

# 2. Redis Caching

Redis is an in-memory data store commonly used for very fast data retrieval.

A database query can involve:

```text
Network communication
|
Query processing
|
Index lookup
|
Database execution
|
Result conversion
```

If the same expensive data is requested repeatedly, Redis can store the result temporarily in memory.

Normal request:

```text
Client
|
Express
|
MongoDB
|
Response
```

Cached request:

```text
Client
|
Express
|
Redis
|
Cached response
```

When Redis already contains the required data, the database query can be skipped.

## Where caching is useful

Caching is useful when:

* The same data is requested frequently.
* The data does not change very often.
* Database queries are expensive.
* External API requests are expensive.
* Response latency needs to be reduced.
* Database load needs to be reduced.

Examples:

```text
Product categories
Popular products
Dashboard statistics
Public configuration
Frequently requested reports
Frequently requested task lists
```

Caching is not automatically useful for every endpoint.

Highly dynamic data may become stale quickly.

For example, a payment status endpoint should not blindly return an old cached result when the latest database value is required.

## Redis is not normally the primary database

MongoDB:

```text
Persistent application data
```

Redis:

```text
Fast temporary/shared data
```

If Redis loses a cached value, the original database should still contain the actual task.

This makes Redis a caching layer rather than the source of truth for ordinary application data.

## Installing Redis client

```bash
npm install redis
```

Example connection:

```js
const { createClient } = require("redis");

const redisClient = createClient({
    url: process.env.REDIS_URL
});

redisClient.on("error", error => {
    console.error("Redis error:", error);
});

await redisClient.connect();
```

The Redis connection should normally be created once when the application starts.

A new Redis connection should not be created for every HTTP request.

## Redis environment variable

Development:

```env
REDIS_URL=redis://localhost:6379
```

Production:

```env
REDIS_URL=<managed-redis-connection-string>
```

The production connection string may contain credentials and should not be committed to Git.

## Cache keys

Redis needs a key to identify cached data.

Examples:

```text
tasks:all
tasks:priority:high
tasks:priority:medium
tasks:priority:low
task:65f123...
```

A cache key should clearly represent the data stored under it.

Bad:

```text
data
```

Better:

```text
tasks:all
```

For a specific task:

```text
task:65f123abc
```

## Cache-aside pattern

The application first checks Redis.

```text
Request
|
Redis GET
|
Cache exists?
|
YES -> Return cached data
|
NO
|
Query MongoDB
|
Store result in Redis
|
Return result
```

This is commonly called the cache-aside pattern.

## Example cached endpoint

```js
app.get("/api/v1/tasks", async (req, res, next) => {
    try {
        const { priority } = req.query;

        const cacheKey = `tasks:priority:${priority || "all"}`;

        const cachedTasks = await redisClient.get(cacheKey);

        if (cachedTasks) {
            return res.status(200).json(
                JSON.parse(cachedTasks)
            );
        }

        const filter = {};

        if (priority) {
            filter.priority = priority;
        }

        const tasks = await Task.find(filter);

        await redisClient.setEx(
            cacheKey,
            60,
            JSON.stringify(tasks)
        );

        return res.status(200).json(tasks);
    } catch (error) {
        next(error);
    }
});
```

The first request:

```text
GET /tasks
|
Redis MISS
|
MongoDB query
|
Redis SET
|
Response
```

The next request before the TTL expires:

```text
GET /tasks
|
Redis HIT
|
Response
```

MongoDB does not need to execute the query again.

## JSON.stringify and JSON.parse

Redis commonly stores values as strings.

JavaScript object:

```js
const task = {
    title: "Fix payment issue",
    priority: "high"
};
```

Before storing:

```js
JSON.stringify(task);
```

Result:

```text
{"title":"Fix payment issue","priority":"high"}
```

After retrieving:

```js
JSON.parse(cachedTask);
```

The string becomes a JavaScript object again.

Flow:

```text
JavaScript object
|
JSON.stringify()
|
Redis string
|
JSON.parse()
|
JavaScript object
```

## TTL

TTL means Time To Live.

Example:

```js
await redisClient.setEx(
    cacheKey,
    60,
    JSON.stringify(tasks)
);
```

`60` means the cache entry expires after 60 seconds.

TTL prevents cached data from remaining forever.

A suitable TTL depends on how frequently the original data changes.

Example:

```text
Frequently changing dashboard
|
Short TTL

Product category list
|
Longer TTL

Static configuration
|
Long TTL
```

There is no universal TTL value.

Long TTL:

```text
More cache reuse
Less database traffic
Higher chance of stale data
```

Short TTL:

```text
Fresher data
More database requests
Lower cache reuse
```

## Cache invalidation

Caching becomes more complicated when the database data changes.

Example:

```text
GET /tasks
|
Redis stores tasks:all
```

Then:

```text
PATCH /tasks/:id
|
Task changes in MongoDB
```

The existing `tasks:all` value is now stale.

The cache should be invalidated.

Example:

```js
await Task.findByIdAndUpdate(taskId, update);

await redisClient.del("tasks:all");
```

For multiple filtered caches:

```text
tasks:all
tasks:priority:high
tasks:priority:medium
tasks:priority:low
```

A task update can affect multiple cached representations.

This is why caching should be added only when the performance benefit is worth the additional invalidation complexity.

## Cache invalidation after creation

Example:

```js
const task = await Task.create(req.body);

await redisClient.del("tasks:all");

return res.status(201).json(task);
```

The newly created task will not be missing from a stale `tasks:all` cache.

## Cache invalidation after update

Example:

```js
const task = await Task.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
        new: true
    }
);

await redisClient.del(`task:${req.params.id}`);
await redisClient.del("tasks:all");

return res.status(200).json(task);
```

## Cache invalidation after delete

```js
await Task.findByIdAndDelete(req.params.id);

await redisClient.del(`task:${req.params.id}`);
await redisClient.del("tasks:all");

return res.status(204).send();
```

Filtered cache keys may also need invalidation depending on the application.

## Cache hit and cache miss logging

During development:

```js
console.log("Redis cache hit");
```

and:

```js
console.log("Redis cache miss");
```

These logs help verify that caching is actually working.

For production, a structured logging system should be used instead of uncontrolled console output.

## Cache stampede

A cache stampede can happen when a popular cache entry expires and many requests arrive at almost the same time.

Example:

```text
100 requests
|
Same cache key
|
Cache expired
|
100 requests query MongoDB
```

Instead of reducing database traffic, the expired cache can temporarily create a large database load.

Large production systems can use techniques such as:

* Request coalescing
* Redis locking
* Stale-while-revalidate
* Randomized TTLs
* Background refresh

A simple Task Manager API normally does not need these techniques immediately.

# 3. PM2 Process Management

Node.js runs JavaScript using an event loop and a main JavaScript execution thread.

A single Node.js process does not automatically execute JavaScript across every CPU core.

For example:

```text
Server
|
8 CPU cores
|
Node.js process
|
Main JavaScript execution
```

One Node.js process does not mean all 8 CPU cores are automatically being used for JavaScript execution.

Multiple Node.js processes can be created to increase application throughput on multi-core machines.

PM2 is a process manager used to manage Node.js applications in production.

PM2 can:

* Start applications
* Restart crashed applications
* Manage application processes
* Manage logs
* Run multiple instances
* Run applications in cluster mode
* Reload applications
* Manage environment configuration

## Installing PM2

```bash
npm install -g pm2
```

Start the application:

```bash
pm2 start src/server.js --name task-api
```

Check running processes:

```bash
pm2 list
```

View logs:

```bash
pm2 logs task-api
```

Restart:

```bash
pm2 restart task-api
```

Stop:

```bash
pm2 stop task-api
```

Delete:

```bash
pm2 delete task-api
```

## PM2 cluster mode

PM2 can start multiple instances of the same Node.js application.

Example:

```bash
pm2 start src/server.js -i 4
```

This creates four Node.js worker processes.

Conceptually:

```text
PM2
|
|-- Node Worker 1
|-- Node Worker 2
|-- Node Worker 3
|-- Node Worker 4
```

Each worker is a separate Node.js process.

Each worker has its own:

* Event loop
* JavaScript memory
* Variables
* Module instances

## Using available CPU capacity

```bash
pm2 start src/server.js -i max
```

`max` tells PM2 to create instances based on the available CPU capacity.

The actual number of useful workers depends on:

* CPU count
* Workload
* Memory
* Database performance
* External services
* Application architecture

More workers do not automatically mean better performance.

## Request distribution

With cluster mode:

```text
Client
|
PM2 / Node cluster
|
|-- Worker 1
|-- Worker 2
|-- Worker 3
|-- Worker 4
```

Incoming requests can be distributed among workers.

From the API client's perspective, the endpoint remains the same.

The important difference is that multiple Node.js processes are available to handle traffic.

## Worker memory is separate

Consider:

```js
let requestCount = 0;
```

Worker 1:

```text
requestCount = 100
```

Worker 2:

```text
requestCount = 80
```

These values are not automatically shared.

Each process has separate memory.

This means normal JavaScript variables should not be used as shared application state in a clustered application.

For shared state, external storage can be used:

```text
Redis
Database
External session store
```

## Stateless application

A clustered Express API should ideally be stateless.

For example, this is problematic as shared session storage:

```js
const loggedInUsers = {};
```

Worker 1 may contain a user's session while the next request reaches Worker 2.

Worker 2 does not automatically have Worker 1's memory.

A shared session store such as Redis can solve this problem.

```text
Worker 1
|
Redis
|
Worker 2
|
Redis
|
Worker 3
```

All workers can access the same external state.

## CPU-bound operations

Examples of CPU-heavy work:

* Large image processing
* Video processing
* Large file transformations
* Complex calculations
* Heavy cryptographic operations

A CPU-heavy operation can block the event loop of the worker handling it.

Adding more PM2 workers can increase overall throughput, but it does not make one CPU-heavy request non-blocking.

For heavy CPU tasks, other approaches may be more suitable:

```text
Worker Threads
Job queues
Background workers
Separate processing services
```

# 4. PM2 Ecosystem Configuration

PM2 settings can be stored in:

```text
ecosystem.config.js
```

Example:

```js
module.exports = {
    apps: [
        {
            name: "task-api",
            script: "./src/server.js",
            instances: "max",
            exec_mode: "cluster",
            env: {
                NODE_ENV: "development",
                PORT: 3000
            },
            env_production: {
                NODE_ENV: "production",
                PORT: 3000
            }
        }
    ]
};
```

Production start:

```bash
pm2 start ecosystem.config.js --env production
```

This configuration makes deployment commands more predictable.

Instead of remembering a long command every time, the process configuration stays inside the project.

# 5. Graceful Shutdown

Production processes can receive shutdown signals during:

* Deployment
* PM2 reload
* Server restart
* Cloud instance replacement
* Container shutdown

The application should close resources cleanly instead of immediately terminating active operations.

Example:

```js
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
    console.log("SIGTERM received");

    server.close(() => {
        console.log("HTTP server closed");
        process.exit(0);
    });
});
```

A larger application should also close:

```text
MongoDB connection
Redis connection
Queue consumers
Other external resources
```

Graceful shutdown reduces the chance of interrupted requests and incomplete operations during deployment.

# 6. Production Environment Configuration

Development and production environments usually require different configuration.

Development:

```text
Local MongoDB
Local Redis
Detailed debugging
Development logging
```

Production:

```text
Cloud database
Managed Redis
Secure secrets
Production logging
Production monitoring
```

`NODE_ENV` identifies the current runtime environment.

Example:

```env
NODE_ENV=production
```

Application code can read it:

```js
const isProduction =
    process.env.NODE_ENV === "production";
```

## Environment variables

Configuration should not be hardcoded into source code.

Bad:

```js
const mongoUrl =
    "mongodb+srv://username:password@cluster...";
```

Better:

```js
const mongoUrl = process.env.MONGODB_URI;
```

Common variables:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=
REDIS_URL=
JWT_SECRET=
```

Secrets should not be committed to Git.

`.gitignore`:

```gitignore
.env
node_modules/
```

An `.env.example` file can document required configuration:

```env
NODE_ENV=
PORT=
MONGODB_URI=
REDIS_URL=
JWT_SECRET=
```

The example file contains variable names without actual credentials.

# 7. Production Logging

Development logging may look like:

```js
console.log(req.method, req.url);
```

This is useful during development but production applications require more structured information.

A production request log can contain:

```json
{
    "level": "info",
    "method": "GET",
    "path": "/api/v1/tasks",
    "statusCode": 200,
    "responseTime": 42
}
```

Useful production log information:

* Timestamp
* Log level
* HTTP method
* Request path
* Status code
* Response duration
* Request ID
* Process ID
* Error details when appropriate

## Request ID

A request ID helps trace a single request through multiple systems.

Example:

```text
Request ID: 8c1e...

Express
|
MongoDB
|
Redis
|
External service
|
Response
```

If the request fails, the same request ID can be searched in logs.

This becomes particularly useful when multiple PM2 workers are running.

## Sensitive information in logs

Sensitive information should not be logged.

Examples:

* Passwords
* JWT secrets
* Database passwords
* Credit card numbers
* Private tokens
* Sensitive personal information

Bad:

```js
console.log(req.body);
```

if the request body contains passwords or sensitive information.

Logs should provide enough information for debugging without exposing confidential data.

## Production errors

The client should receive a safe response:

```json
{
    "message": "Internal server error"
}
```

while the server logs the actual diagnostic information.

Example server log:

```text
Database connection timeout
requestId=8c1e...
route=GET /api/v1/tasks
```

Returning complete stack traces to clients can expose internal implementation details.

# 8. Production Deployment Pipeline

Deployment moves the application from development into infrastructure where it can serve real traffic.

A basic deployment pipeline:

```text
Git push
|
Install dependencies
|
Run tests
|
Build
|
Deploy
|
Start/reload application
|
Health check
|
Production
```

The important part is that deployment should be repeatable.

Manual deployment such as:

```text
Copy files
|
Install random dependencies
|
Start server
|
Hope everything works
```

is difficult to maintain.

## npm ci

For CI/CD environments:

```bash
npm ci
```

installs dependencies from `package-lock.json`.

This provides a predictable dependency installation process.

Production can use:

```bash
npm ci --omit=dev
```

when development dependencies are not required at runtime.

## Test before deployment

A simple pipeline:

```bash
npm ci
npm test
npm run build
```

If tests fail:

```text
npm test
|
FAIL
|
Deployment stops
```

If tests pass:

```text
npm test
|
PASS
|
Build
|
Deploy
```

This prevents known test failures from being deployed automatically.

## Build step

A plain JavaScript Express API may not need a build step.

A TypeScript application may use:

```bash
npm run build
```

A frontend application such as React or Vue normally requires its own build process.

The deployment pipeline should match the actual project architecture.

# 9. Health Check Endpoint

A production application should expose a lightweight health endpoint.

Example:

```js
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok"
    });
});
```

A cloud platform or monitoring service can call:

```text
GET /health
```

to verify that the API is responding.

Example response:

```json
{
    "status": "ok"
}
```

## Database health check

A more advanced health endpoint can also check dependencies.

```text
API
|
MongoDB reachable?
|
Redis reachable?
|
Return health information
```

However, dependency checks should be designed carefully.

If Redis temporarily fails but the application can still operate without caching, the API may still be able to serve requests.

For larger systems, separate concepts such as:

```text
Liveness
Readiness
```

can be used.

Liveness indicates that the process itself is alive.

Readiness indicates that the application is ready to receive traffic.

# 10. Cloud Deployment Architecture

A production Node.js API can be structured like:

```text
Client
|
Cloud Load Balancer
|
Node.js Application
|
|-- PM2 Worker 1
|-- PM2 Worker 2
|-- PM2 Worker 3
|-- PM2 Worker 4
|
|-- MongoDB
|
|-- Redis
```

MongoDB stores persistent application data.

Redis stores cached data and potentially other shared temporary state.

PM2 manages Node.js processes.

The cloud infrastructure provides the compute and networking required to make the API available.

## Stateless API architecture

Each worker should be capable of processing requests independently.

Shared state should be placed outside the worker process when required.

Example:

```text
PM2 Worker 1
|
PM2 Worker 2
|
PM2 Worker 3
|
      |
      v
    Redis
      |
      v
   MongoDB
```

This allows requests to move between workers without losing important application state.

# 11. Production Database Configuration

Development and production databases should be separated.

Development:

```env
MONGODB_URI=mongodb://localhost:27017/task_manager_dev
```

Production:

```env
MONGODB_URI=mongodb+srv://...
```

The production database should not be used for local experiments or automated tests.

Database credentials should be stored securely through environment configuration.

Database access should also use appropriate:

* Authentication
* Network restrictions
* User permissions
* Encryption
* Backup strategy

# 12. Complete Practice Build

The complete module can be implemented using a production-style Task Manager API.

Project structure:

```text
production-task-api/
|
|-- src/
|   |-- app.js
|   |-- server.js
|   |
|   |-- config/
|   |
|   |-- routes/
|   |
|   |-- controllers/
|   |
|   |-- models/
|   |
|   |-- middleware/
|   |
|   |-- services/
|   |
|   |-- utils/
|
|-- tests/
|   |-- tasks.test.js
|   |-- health.test.js
|
|-- ecosystem.config.js
|-- .env.example
|-- .gitignore
|-- package.json
|-- package-lock.json
```

## Required endpoints

```text
POST   /api/v1/tasks
GET    /api/v1/tasks
GET    /api/v1/tasks/:id
PATCH  /api/v1/tasks/:id
DELETE /api/v1/tasks/:id
GET    /health
```

## Task model

```text
Task
|
|-- title
|-- description
|-- priority
|-- status
|-- createdAt
|-- updatedAt
```

MongoDB remains the source of truth.

## Testing layer

Tests should cover:

```text
POST /tasks
|
Valid task
Invalid task

GET /tasks
|
All tasks
Priority filtering
Empty result

GET /tasks/:id
|
Existing task
Missing task

PATCH /tasks/:id
|
Valid update
Invalid update
Missing task

DELETE /tasks/:id
|
Existing task
Missing task

GET /health
|
Healthy response
```

The entire suite should run with:

```bash
npm test
```

## Redis layer

Cache:

```text
GET /api/v1/tasks
GET /api/v1/tasks/:id
```

Cache keys:

```text
tasks:all
tasks:priority:high
tasks:priority:medium
tasks:priority:low
task:<id>
```

Example:

```js
await redisClient.setEx(
    cacheKey,
    60,
    JSON.stringify(tasks)
);
```

TTL:

```text
60 seconds
```

Write operations should invalidate affected cache entries.

```text
POST task
|
MongoDB create
|
Invalidate tasks cache

PATCH task
|
MongoDB update
|
Invalidate task cache
|
Invalidate affected task list cache

DELETE task
|
MongoDB delete
|
Invalidate task cache
|
Invalidate affected task list cache
```

## PM2 layer

Development:

```bash
npm run dev
```

Production:

```bash
pm2 start ecosystem.config.js --env production
```

Cluster configuration:

```text
PM2
|
|-- Worker 1
|-- Worker 2
|-- Worker 3
|-- Worker 4
```

All workers use the same MongoDB and Redis services.

No worker should depend on another worker's local JavaScript memory for shared application state.

## Environment configuration

`.env.example`:

```env
NODE_ENV=production
PORT=3000
MONGODB_URI=
REDIS_URL=
JWT_SECRET=
```

Actual production values should be configured through the server or cloud platform.

The actual `.env` file should not be committed.

## Production logging

Useful request information:

```text
Timestamp
Process ID
Request ID
HTTP method
URL
Status code
Response time
```

Example:

```text
2026-10-07T10:30:22.000Z
pid=18240
requestId=abc123
GET /api/v1/tasks
status=200
duration=24ms
```

# 13. Performance Verification

Caching and clustering should not be added only because they are common production technologies.

Performance should be measured before and after optimization.

Important metrics include:

```text
Average response time
P95 response time
P99 response time
Requests per second
Database query count
Redis cache hit rate
CPU usage
Memory usage
Error rate
```

Example:

```text
Before Redis

Average response time: 180 ms
Database queries: 1000
```

After Redis:

```text
Average response time: 25 ms
Database queries: 50
Cache hit rate: 95%
```

The actual numbers depend on infrastructure and workload.

The important part is measuring the result rather than assuming that caching improved performance.

## Cache hit ratio

Cache hit ratio:

```text
Cache hits / Total cache requests
```

Example:

```text
900 cache hits
100 cache misses

900 / 1000

= 90% cache hit ratio
```

A low cache hit ratio can indicate:

* TTL is too short
* Cache keys are too specific
* Data changes frequently
* Requests are not repeated
* Cache is being invalidated too frequently

# 14. Load Testing

Load testing generates many requests against an API to observe how the application behaves under traffic.

`autocannon` is one tool that can be used with Node.js applications.

Install:

```bash
npm install --save-dev autocannon
```

Example:

```bash
npx autocannon -c 50 -d 20 http://localhost:3000/api/v1/tasks
```

`-c 50` means 50 concurrent connections.

`-d 20` means 20 seconds.

This can be used to compare:

```text
Single Node.js process
vs
PM2 cluster
```

and:

```text
MongoDB-only endpoint
vs
Redis-cached endpoint
```

Load tests should run against a controlled environment.

A load test should not be directed at an unrelated production service without authorization.

# 15. Final Module Workflow

The complete module workflow:

```text
Build Express API
|
Write automated endpoint tests
|
Connect MongoDB
|
Run test suite
|
Identify expensive/repeated database reads
|
Add Redis caching where appropriate
|
Measure cache hit rate
|
Measure response time
|
Configure PM2
|
Run multiple workers when workload benefits from it
|
Keep application state external/shared where required
|
Configure NODE_ENV=production
|
Configure production secrets
|
Add production logging
|
Add health endpoint
|
Run tests in deployment pipeline
|
Deploy application
|
Start/reload PM2 workers
|
Run health check
|
Monitor logs
|
Monitor CPU
|
Monitor memory
|
Monitor latency
|
Monitor errors
```

The complete progression is:

```text
Development
|
Automated Testing
|
Reliable API
|
Caching
|
Performance Measurement
|
PM2 Process Management
|
Production Configuration
|
Deployment
|
Monitoring
```

# Notes:

* Automated tests should protect important API behavior from regression.
* Supertest is useful for testing Express endpoints without manually starting a server.
* `app.js` and `server.js` should be separated so the Express application can be imported into tests.
* Tests should cover successful requests as well as expected failures.
* Authentication and authorization behavior should be tested.
* Production tests should never accidentally use the production database.
* MongoDB should remain the source of truth for persistent task data.
* Redis should normally be treated as a cache or shared temporary data store.
* Cache keys should clearly identify the data being cached.
* TTL controls how long cached data remains available.
* Database writes can make existing cache entries stale.
* Cache invalidation should be designed together with write operations.
* PM2 can restart crashed Node.js processes.
* PM2 cluster mode can run multiple Node.js processes.
* Multiple workers can make better use of multi-core server capacity.
* More workers do not automatically mean better performance.
* Normal JavaScript variables are not automatically shared between PM2 workers.
* Shared state should use Redis, a database or another external store when required.
* CPU-heavy operations may require Worker Threads, background workers or separate services.
* `NODE_ENV=production` identifies the production environment.
* Secrets should never be committed to Git.
* `.env` should normally be added to `.gitignore`.
* Production logs should contain enough information to diagnose problems without exposing sensitive information.
* Request IDs are useful for tracing requests across multiple workers and services.
* A health endpoint gives deployment and monitoring systems a simple way to check application availability.
* CI/CD should run tests before deployment.
* A failed test should stop an automated deployment.
* Performance improvements should be measured instead of assumed.
* Redis caching, PM2 clustering and other optimizations should solve an actual bottleneck rather than being added only because they are common production technologies.




