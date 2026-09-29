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
