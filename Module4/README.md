# Module 4 - MongoDB E-commerce API

A practical Node.js + Express + MongoDB application for learning database integration with Mongoose. It models Users, Products and Orders and includes relationships, population, indexes, connection pooling/events and a real MongoDB transaction.

## Topics covered

- SQL vs NoSQL modeling decisions
- Mongoose ODM: schemas, models, validation and queries
- MongoDB connection pool configuration
- `connected`, `error` and `disconnected` listeners
- One-to-many relationships with ObjectId references
- Mongoose `populate()` as a convenient join-like operation
- Compound and text indexes
- Transaction handling with Mongoose sessions
- Order-time price snapshots / deliberate denormalization
- Simple browser frontend for testing the API

## Why this data model

SQL would normally use `users`, `products`, `orders` and `order_items` tables with foreign keys. MongoDB uses documents and ObjectIds. This project keeps User -> Orders and Order Item -> Product as references, while storing `productName` and `unitPrice` inside an order item. That snapshot is intentional: changing today's product price must not rewrite yesterday's order history.

```text
User 1 ---- many Orders
Order 1 ---- many OrderItems
OrderItem ---- 1 Product
```

## Setup

1. Install Node.js and check `node -v` and `npm -v`.
2. Run `npm install`.
3. Create a MongoDB Atlas cluster and database user.
4. Allow the development machine IP in Atlas Network Access.
5. Copy `.env.example` to `.env` and set `MONGODB_URI`.
6. Run `npm run seed` to create sample users/products. The terminal prints their ObjectIds.
7. Run `npm run dev`.
8. Open `http://localhost:3000`.

MongoDB transactions require a deployment that supports transactions. MongoDB Atlas is the easiest setup for this project.

## API

```text
GET  /api/v1/health
POST /api/v1/users
GET  /api/v1/users
GET  /api/v1/users/:userId/orders
POST /api/v1/products
GET  /api/v1/products
GET  /api/v1/products/:productId
POST /api/v1/orders
GET  /api/v1/orders
GET  /api/v1/orders/:orderId
```

Create user:

```json
{"name":"Arun","email":"arun@example.com"}
```

Create product:

```json
{"name":"Laptop Stand","description":"Adjustable stand","price":1599,"category":"Accessories","stock":10}
```

Create order:

```json
{"userId":"USER_ID","items":[{"productId":"PRODUCT_ID","quantity":2}]}
```

## Connection pooling

`src/config/database.js` uses `maxPoolSize: 10` and `minPoolSize: 2`. Mongoose reuses connections instead of creating a new database connection for every HTTP request. These numbers are learning defaults; real values should be chosen from traffic and deployment limits.

## Indexes

`User.email` has a unique index. Products have `{ category: 1, isActive: 1 }` for filtering and a text index for name/description search. Orders have `{ user: 1, createdAt: -1 }` for a user's newest orders and `{ status: 1, createdAt: -1 }` for status-based queries. Indexes speed matching reads but consume storage and add write overhead, so they should follow real query patterns.

## Population

Orders contain ObjectId references. The API uses:

```js
.populate("user", "name email")
.populate("items.product", "name price category")
```

This asks Mongoose to load the related documents for the API response. It is convenient, but it is not a reason to reference every possible field in a real application.

## Transaction flow

Order creation changes more than one document:

```text
request
|
find user
|
find products
|
check stock
|
reduce product stock
|
create order
|
commit transaction
```

If one step fails, the code calls `abortTransaction()`, so the stock changes are rolled back and the order is not left half-created.

The stock update also checks `{ stock: { $gte: quantity } }`. This protects against a race where stock changes between the first read and the actual update.

## Learning experiments

- Temporarily throw an error after stock update and verify rollback.
- Remove `.populate()` and compare the ObjectId response.
- Change a product price after creating an order and verify the old `unitPrice` remains unchanged.
- Remove an index and inspect how query performance changes as data grows.
- Try an order quantity larger than available stock and verify that no order is created.

## Project structure

```text
module4-mongodb-ecommerce/
├── public/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── scripts/
│   └── seed.js
├── src/
│   ├── config/database.js
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── app.js
│   └── server.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Comments in the code are intentionally short and written like comments a junior developer would actually leave while learning the codebase. JavaScript variables and functions use camelCase.
