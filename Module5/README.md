# ShieldCart - Module 5: Advanced Authentication, Security & RBAC

ShieldCart is a small e-commerce API that is built to **teach** authentication, authorization and API security with real code. It is a learning POC, **not production-ready** (see sections 28 and 29).

## 1. Project overview

Two roles exist:

- `user`: can register, log in, log out, refresh the access token, see their profile and view active products.
- `admin`: everything a user can do, plus create, update and deactivate products.

A plain HTML/CSS/JS frontend (served from `public/`) lets you test the whole flow in the browser, including a live access-token countdown and a request log that shows every status code.

## 2. Technologies

Node.js (ES modules), Express 4, MongoDB Atlas, Mongoose, dotenv, bcrypt, jsonwebtoken, Helmet, CORS, express-rate-limit, Zod, cookie-parser, nodemon. No TypeScript, no Passport, no Redis, no Docker.

## 3. Features

- Registration and login with bcrypt (cost 12)
- JWT access token (15 min) and refresh token (7 days)
- Refresh-token rotation, revocation on logout, only SHA-256 hashes stored
- Authentication middleware that re-checks the user in MongoDB
- RBAC middleware: `requireRole("admin")`
- Zod validation, Helmet, CORS, rate limiting, centralized error handling
- Soft delete for products
- Seed script and a browser frontend

## 4. Project structure

```
module5-auth-security-rbac/
├── public/                  index.html, styles.css, app.js (plain frontend)
├── scripts/seed.js          clears and fills the database
├── src/
│   ├── config/              env.js (reads .env), database.js (Mongoose connection)
│   ├── controllers/         auth.controller.js, product.controller.js
│   ├── middleware/          asyncHandler, authenticateToken, requireRole, validate, errorHandler
│   ├── models/              User.js, Product.js, RefreshToken.js
│   ├── routes/              auth.routes.js, product.routes.js
│   ├── schemas/             auth.schema.js, product.schema.js (Zod)
│   ├── utils/               AppError.js, jwt.js
│   ├── app.js               builds the Express app (no listen here)
│   └── server.js            connects to MongoDB, then listens
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

`app.js` and `server.js` are separate so the app can be imported without opening a port or a database connection.

## 5. Installation

You need Node.js 18 or newer and a free MongoDB Atlas account.

## 6. MongoDB Atlas setup

Atlas hierarchy:

```
Atlas account -> Project -> Cluster -> Database (module5_auth) -> Collections (users, products, refreshtokens) -> Documents
```

1. Create an Atlas account and a free **M0 cluster**.
2. **Database Access** -> Add New Database User. Choose username + password authentication, give it "Read and write to any database" (or read/write on `module5_auth`). Remember the password.
3. **Network Access** -> Add IP Address. For learning, "Add Current IP Address" is best. "Allow access from anywhere" (`0.0.0.0/0`) works but is not safe for real data. If your IP changes (home Wi-Fi, mobile data), connections will fail until you add the new one.
4. **Database** -> your cluster -> **Connect** -> **Drivers** -> copy the `mongodb+srv://...` connection string.
5. Put the database name `module5_auth` in the string, right after the host and before the `?` (see `.env.example`).

You do **not** have to create the database or collections manually. MongoDB creates `module5_auth` and the `users`, `products` and `refreshtokens` collections the first time data is inserted (the seed script does that).

## 7. .env configuration

Copy the example file and edit it:

```bash
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
```

Set the values:

- `MONGODB_URI`: your Atlas string with the real username, password and `module5_auth` database name.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: two **different** long random strings. Generate them with:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

- `CLIENT_ORIGIN`: the origin allowed by CORS. `http://localhost:3000` when you use the built-in frontend.
- `PORT`, `NODE_ENV`: leave as in the example while developing.

**If the MongoDB password contains special characters** (`@ : / ? # [ ] %` and others), it must be URL encoded inside the connection string. For example `p@ss/word` becomes `p%40ss%2Fword`. A wrong encoding is the most common cause of "bad auth" or "invalid URL" errors. The simplest fix is to create the Atlas user with a password that only has letters and numbers.

`.env` is in `.gitignore` and must never be committed. `src/config/env.js` stops the app at startup if a variable is missing or if both JWT secrets are identical.

## 8. npm install

```bash
npm install
```

## 9. npm run seed

```bash
npm run seed
```

This clears users, products and refresh tokens, then creates:

| Role  | Email             | Password      |
| ----- | ----------------- | ------------- |
| admin | admin@example.com | AdminPass2026 |
| user  | user@example.com  | UserPass2026  |

and six products (Mechanical Keyboard, Wireless Mouse, USB-C Hub, 27-inch Monitor, Laptop Stand, 1080p Webcam). The script refuses to run when `NODE_ENV=production`.

## 10. npm run dev

```bash
npm run dev      # nodemon, restarts on file changes
npm start        # plain node
```

Open `http://localhost:3000`. Health check: `http://localhost:3000/api/v1/health`.

Startup order: read `.env` -> connect to MongoDB -> **only then** `app.listen`. If MongoDB can't be reached within 5 seconds the process prints the error and exits, it never starts listening.

### Why "connected" and not "connect"

A Mongoose connection emits `connected` when the first connection to MongoDB is ready, `error` when something goes wrong and `disconnected` when it is lost. There is no generic `connect` event on a Mongoose connection (the name belongs to Node sockets and to the lower-level driver), so `database.js` listens to `connected`, `error` and `disconnected` and prints one clear message for each.

### Connection pooling

`maxPoolSize: 10` and `minPoolSize: 2` tell the driver to keep between 2 and 10 open sockets and reuse them. Opening a new TCP + TLS connection for every request would be slow and Atlas free clusters limit the number of connections. `serverSelectionTimeoutMS: 5000` makes the app fail in 5 seconds (instead of 30) when Atlas is unreachable.

## 11. API endpoints

Base path: `/api/v1`. Error responses always look like `{ "message": "..." }` and validation errors add `"errors": [{ "field", "message" }]`.

| Method | Path | Access | Purpose |
| ------ | ---- | ------ | ------- |
| GET | `/health` | public | Health check |
| POST | `/auth/register` | public, rate limited | Create account, returns user + tokens (201) |
| POST | `/auth/login` | public, rate limited | Returns user + tokens |
| POST | `/auth/refresh` | public, rate limited | Rotate refresh token, returns new pair |
| POST | `/auth/logout` | logged in | Revoke the given refresh token |
| GET | `/auth/me` | logged in | Current user |
| GET | `/products` | logged in | Active products (optional `?category=`) |
| GET | `/products/:id` | logged in | One active product |
| POST | `/products` | admin | Create product |
| PATCH | `/products/:id` | admin | Update product |
| DELETE | `/products/:id` | admin | Deactivate product (soft delete) |

Token responses look like:

```json
{
  "user": { "id": "...", "name": "Demo User", "email": "user@example.com", "role": "user", "isActive": true },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

## 12. Authentication flow

```
Register / Login
  -> Zod validates body
  -> bcrypt hash (register) or bcrypt.compare (login)
  -> createAccessToken()  (JWT, 15 min)
  -> createRefreshToken() (JWT, 7 days) -> SHA-256 hash saved in MongoDB
  -> client receives { user, accessToken, refreshToken }

Protected request
  -> Authorization: Bearer <accessToken>
  -> authenticateToken: verify JWT -> load user from MongoDB -> check isActive -> req.user
  -> next middleware / controller
```

## 13. Authorization flow

Authentication answers "who are you?". Authorization answers "what may you do?".

```
authenticateToken -> req.user (role comes from MongoDB)
requireRole("admin") -> role is "admin"? next() : 403
```

## 14. JWT explanation

A JWT has three base64 parts: `header.payload.signature`. The payload is **readable by anyone** (do not put secrets in it) but cannot be changed without invalidating the signature, which only the server can create because only it knows the secret.

ShieldCart access token payload:

```json
{ "sub": "<userId>", "role": "user", "type": "access", "iat": 1700000000, "exp": 1700000900 }
```

- `sub`: whose token it is. `role`: role when the token was issued. `type`: separates access from refresh tokens. `exp`: automatic expiry.
- Access and refresh tokens use **different secrets**, and `type` is checked too, so one can't be used as the other.
- The algorithm is pinned to HS256 on sign and verify.
- Access tokens are short lived (15 minutes) because a JWT can't be recalled once issued.

## 15. Refresh-token rotation

A refresh token is a long lived token whose only job is to get a new access token. Because it lives for 7 days it is more dangerous if stolen, so ShieldCart **rotates** it: every refresh token works **once**.

`POST /auth/refresh` does this:

1. Receive the refresh token from the body.
2. Verify the JWT signature and expiry.
3. Check `type === "refresh"`.
4. Hash the token with SHA-256.
5. Find the hash in the `refreshtokens` collection.
6. Reject it if `revokedAt` is set.
7. Reject it if `expiresAt` has passed.
8. Revoke the old token (`revokedAt = now`). This is one atomic update that only matches while `revokedAt` is `null`, so two simultaneous requests can't both succeed.
9. Create a new access token.
10. Create a new refresh token.
11. Store the new refresh token hash.
12. Return the new pair.

If the **old** token is sent again, step 6 fails and the API returns **401**. That is why the frontend must always replace its stored refresh token with the one from the latest response.

### Revocation

Revoking means setting `revokedAt`. It happens on rotation and on logout. The document stays in MongoDB until `expiresAt` (a TTL index removes it) so that a reused token is recognised and rejected rather than looking unknown.

### Why only the hash is stored

If the database leaks (backup, injection, a leaked Atlas credential), raw refresh tokens would let an attacker call `/refresh` as every user. SHA-256 hashes can't be turned back into tokens. The token is long and random so a fast hash is fine here (unlike passwords, which need bcrypt).

## 16. bcrypt explanation

Passwords are never stored. On register: `plain password -> bcrypt.hash(password, 12) -> passwordHash -> MongoDB`. On login: `bcrypt.compare(password, passwordHash)`.

- bcrypt adds a random salt to every hash, so two users with the same password get different hashes.
- Cost 12 makes each hash deliberately slow (about a quarter of a second), which makes guessing millions of passwords expensive.
- bcrypt only reads the first 72 bytes, so the Zod schema limits passwords to 72 characters.
- Login uses the same message ("Invalid email or password") for an unknown email and a wrong password. When the email doesn't exist, the code still runs bcrypt against a dummy hash so response time doesn't reveal which emails are registered.
- `passwordHash` is removed by `toSafeObject()` and by the model's `toJSON` transform.

## 17. RBAC explanation

Role-Based Access Control: permissions are attached to roles, and users get a role. ShieldCart has `user` and `admin`.

```js
router.post("/", authenticateToken, requireRole("admin"), validate(createProductSchema), createProduct);
```

`requireRole` reads `req.user.role`. That role comes from **MongoDB** (loaded in `authenticateToken`), not from the JWT. If an admin is demoted or a user is disabled, the change applies immediately instead of after the token expires. A new account is always `user`: `role` is not accepted by the register schema (`.strict()`), so nobody can register as admin.

## 18. 401 vs 403

- **401 Unauthorized** = not authenticated: no token, bad token, expired token, wrong credentials.
- **403 Forbidden** = authenticated, but not allowed: a normal user calling `POST /products`.

Retrying a 401 with a fresh login/refresh can work. A 403 will keep failing until the user's role changes.

## 19. Helmet

Helmet sets security headers: `Content-Security-Policy` (only load scripts/styles from the same origin), `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` and more. That is why the frontend has no inline scripts or styles and no external fonts. In development the `upgrade-insecure-requests` directive is removed because Safari then tries to load `http://localhost` over https.

## 20. CORS

CORS is a **browser** rule: a page from one origin can't read responses from another origin unless the API allows it. ShieldCart sends `Access-Control-Allow-Origin: <CLIENT_ORIGIN>` (one exact origin) with `credentials: true`. A wildcard `*` must not be combined with credentials. The bundled frontend is served by the same server (same origin) so CORS is not even needed for it, but it is ready for a separate frontend. CORS does **not** stop curl, Postman or other servers, so it is not an authentication method.

## 21. Rate limiting

- `/auth/register`, `/auth/login`, `/auth/refresh`: **10 failed requests per 15 minutes per IP** (`skipSuccessfulRequests: true`). Without it, an attacker could try thousands of passwords per minute, and bcrypt would also burn CPU on every guess.
- Whole `/api`: a loose 300 requests per 15 minutes, only against obvious abuse.
- Counters live in server memory, so restarting the server resets them. Over HTTP you get `429 Too Many Requests`.

## 22. Zod validation

Every body is parsed with a Zod schema in `validate(schema)` **before** the controller runs. Invalid input returns `400` with field messages. Schemas are `.strict()`, so unknown fields (like `role` or `isActive`) are rejected. `validate` replaces `req.body` with the parsed result (trimmed names, lowercased emails). Product ids in the URL are checked with `validate(productIdSchema, "params")`.

## 23. Mongoose models

- **User**: `name`, `email` (unique, lowercase), `passwordHash`, `role` (`user`/`admin`), `isActive`, timestamps. Has `User.hashPassword`, `User.comparePassword` and `user.toSafeObject()`.
- **Product**: `name`, `description`, `price` (>= 0), `category`, `stock` (whole number >= 0), `isActive`, timestamps.
- **RefreshToken**: `user` (ref to User), `tokenHash` (unique), `expiresAt`, `revokedAt`, timestamps.

Mongoose gives schemas, validation, defaults and query helpers on top of the MongoDB driver. Mongoose builds the declared indexes automatically when the app starts.

## 24. Database indexes

- `users.email` unique: fast login lookup and a hard guarantee against duplicate accounts, even when two requests race.
- `products {category, isActive}`: the product list filters on `isActive: true` and optionally `category`. The index lets MongoDB jump to those documents instead of scanning every product.
- `refreshtokens.tokenHash` unique: every refresh/logout looks tokens up by hash.
- `refreshtokens.user`: find tokens of one user.
- `refreshtokens.expiresAt` TTL (`expireAfterSeconds: 0`): MongoDB deletes expired token documents by itself (its background job runs about once a minute).

## 25. Error handling

- `AppError(message, statusCode)` is thrown on purpose.
- `asyncHandler` wraps async handlers. Express 4 does not forward rejected promises to error middleware, so without it a thrown error inside `async` code would leave the request hanging. `asyncHandler` calls `next(error)` for you and removes repeated `try/catch`.
- `errorHandler` (registered last) converts `AppError`, Zod errors, Mongoose validation and cast errors, duplicate key (`11000`) -> 409, JWT errors, bad JSON and unexpected errors into `{ "message": ... }`.
- Unexpected errors are logged with `console.error`. In production the client only sees "Internal server error" and never a stack trace.

## 26. Middleware order

In `app.js`: `helmet -> cors -> express.json -> cookieParser -> static -> rate limiters -> routes -> 404 -> errorHandler`. Helmet and CORS come first so every response, even an error, has the headers. The body parser must run before anything that reads `req.body`. The error handler must be last or it can't catch errors from earlier middleware.

In a protected admin route: `authenticateToken -> requireRole -> validate -> controller`.

1. Authentication first: `requireRole` needs `req.user`.
2. Authorization second: a normal user should get 403 without us validating (and giving feedback about) a request they are not allowed to make.
3. Validation third: only authorized users reach it, and bad data never reaches the controller.

## 27. Testing instructions

Start the server, run the seed, then test either in the browser (`http://localhost:3000`) or with curl. The examples use bash-style curl (Git Bash, macOS, Linux, WSL). In Windows PowerShell use `curl.exe` and put the JSON in a file (`-d "@body.json"`), or use Postman/Thunder Client.

Setup variables used below (bash):

```bash
BASE=http://localhost:3000/api/v1
```

### Test 1 - Register user

```bash
curl -s -X POST $BASE/auth/register -H "Content-Type: application/json" \
  -d '{"name":"Gowtham","email":"gowtham@example.com","password":"Password123"}'
```

**Expected:** `201` with `user` (no `passwordHash`), `accessToken`, `refreshToken`. **Why:** Zod accepts the data, the email isn't used yet, bcrypt hashes the password, the user is stored with role `user` and a refresh token hash is stored.

### Test 2 - Duplicate registration

Run the same command again. **Expected:** `409 {"message":"Email is already registered"}`. **Why:** the controller finds the existing email (and the unique index would stop it even if two requests raced).

### Test 3 - Login with correct password

```bash
curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"UserPass2026"}'
```

**Expected:** `200` with user and both tokens. Copy them: `ACCESS=<accessToken>` and `REFRESH=<refreshToken>`. **Why:** `bcrypt.compare` matched the stored hash.

### Test 4 - Login with wrong password

```bash
curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"WrongPassword1"}'
```

**Expected:** `401 {"message":"Invalid email or password"}`. **Why:** bcrypt didn't match. A non-existent email gives the exact same message so attackers can't find valid emails.

### Test 5 - Get profile with valid token

```bash
curl -s $BASE/auth/me -H "Authorization: Bearer $ACCESS"
```

**Expected:** `200` with `id`, `name`, `email`, `role`, `isActive`. **Why:** signature valid, type is `access`, the user exists and is active.

### Test 6 - Get profile without token

```bash
curl -s -i $BASE/auth/me
```

**Expected:** `401 {"message":"Authentication required"}`. **Why:** no `Authorization: Bearer` header.

### Test 7 - Expired / invalid access token

```bash
curl -s $BASE/auth/me -H "Authorization: Bearer abc.def.ghi"
```

**Expected:** `401 {"message":"Invalid access token"}`. **Why:** the signature check fails. An expired token (after 15 minutes) gives `401 Access token expired`. A refresh token sent as an access token is also rejected because it uses another secret and has `type: "refresh"`. In the browser, press **Break access token** then **Get profile**: the first call returns 401 in the request log and the page silently refreshes and retries.

### Test 8 - Normal user gets products

```bash
curl -s $BASE/products -H "Authorization: Bearer $ACCESS"
```

**Expected:** `200` with `count` and `products`, only `isActive: true` ones. **Why:** any authenticated user may read the catalogue. Try `?category=Peripherals` to see the filter.

### Test 9 - Normal user tries to create a product

```bash
curl -s -i -X POST $BASE/products -H "Authorization: Bearer $ACCESS" -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Nope","price":10,"category":"Test","stock":1}'
```

**Expected:** `403 {"message":"You do not have permission to perform this action"}`. **Why:** the user is authenticated (so not 401) but `requireRole("admin")` blocks the `user` role. In the browser use **Try admin endpoint**.

### Test 10 - Admin creates product

Login as admin, then `ADMINACCESS=<accessToken>`:

```bash
curl -s -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"AdminPass2026"}'
curl -s -X POST $BASE/products -H "Authorization: Bearer $ADMINACCESS" -H "Content-Type: application/json" \
  -d '{"name":"Noise-Cancelling Headphones","description":"Over-ear Bluetooth headphones with 30 hour battery.","price":129.99,"category":"Audio","stock":25}'
```

**Expected:** `201` with the product. Copy its `id` as `PRODUCTID`. **Why:** authenticated, role is `admin`, body passes Zod.

### Test 11 - Admin updates product

```bash
curl -s -X PATCH $BASE/products/$PRODUCTID -H "Authorization: Bearer $ADMINACCESS" -H "Content-Type: application/json" \
  -d '{"price":119.99,"stock":30}'
```

**Expected:** `200` with the updated product. **Why:** the update schema accepts any subset of fields (at least one) and `findOneAndUpdate` returns the new document.

### Test 12 - Admin deactivates product

```bash
curl -s -X DELETE $BASE/products/$PRODUCTID -H "Authorization: Bearer $ADMINACCESS"
curl -s $BASE/products/$PRODUCTID -H "Authorization: Bearer $ADMINACCESS"
```

**Expected:** first call `200 {"message":"Product deactivated",...}`, second call `404 Product not found`. **Why:** soft delete sets `isActive: false`. The document still exists in Atlas but is hidden from every product query.

### Test 13 - Refresh access token

```bash
curl -s -X POST $BASE/auth/refresh -H "Content-Type: application/json" -d "{\"refreshToken\":\"$REFRESH\"}"
```

**Expected:** `200` with a new `accessToken` **and** a new `refreshToken`. Save them as `NEWREFRESH`. **Why:** rotation. The old refresh token was revoked and a new pair was created.

### Test 14 - Reuse old refresh token

Send the same command again with the old `$REFRESH`. **Expected:** `401 {"message":"Refresh token has been revoked"}`. **Why:** the old token has `revokedAt` set in MongoDB. Each refresh token is valid exactly once.

### Test 15 - Logout

```bash
curl -s -X POST $BASE/auth/logout -H "Authorization: Bearer $NEWACCESS" -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$NEWREFRESH\"}"
```

(`NEWACCESS` is the access token from test 13.) **Expected:** `200 {"message":"Logged out successfully"}`. **Why:** the refresh token hash is revoked, only for the logged-in user.

### Test 16 - Use revoked refresh token

```bash
curl -s -X POST $BASE/auth/refresh -H "Content-Type: application/json" -d "{\"refreshToken\":\"$NEWREFRESH\"}"
```

**Expected:** `401 Refresh token has been revoked`. **Why:** logout revoked it. Note the access token from before logout still works until its 15 minutes end (see section 29).

### Test 17 - Invalid product input

```bash
curl -s -X POST $BASE/products -H "Authorization: Bearer $ADMINACCESS" -H "Content-Type: application/json" \
  -d '{"name":"","description":"x","price":-5,"category":"Test","stock":1.5,"isActive":false}'
```

**Expected:** `400 {"message":"Validation failed","errors":[...]}` listing the empty name, negative price, decimal stock and the unknown `isActive` field. **Why:** Zod runs in `validate` before the controller.

### Test 18 - Rate-limit login

```bash
for i in $(seq 1 11); do curl -s -o /dev/null -w "%{http_code}\n" -X POST $BASE/auth/login \
  -H "Content-Type: application/json" -d '{"email":"user@example.com","password":"WrongPassword1"}'; done
```

**Expected:** ten `401` then `429 {"message":"Too many failed attempts, try again in 15 minutes"}` (if you already made failed attempts, the 429 comes sooner). **Why:** `authLimiter` allows 10 failed attempts per 15 minutes per IP. Restart the server to reset the in-memory counter.

### Test 19 - Invalid product ID

```bash
curl -s $BASE/products/123 -H "Authorization: Bearer $ACCESS"
```

**Expected:** `400 {"message":"Validation failed","errors":[{"field":"id","message":"Invalid product id"}]}`. A well formed id that doesn't exist (`000000000000000000000000`) returns `404`. **Why:** `productIdSchema` rejects ids that aren't 24 hex characters before MongoDB is queried.

### Test 20 - MongoDB connection failure

Edit `.env` and put a wrong password in `MONGODB_URI` (or remove your IP in Atlas Network Access), then run `npm run dev`.

**Expected:** after about 5 seconds the console prints `MongoDB connection error: ...`, then `Could not start the server: ...`, and the process exits. There is **no** "ShieldCart running" line. **Why:** `server.js` awaits `connectDatabase()` before `app.listen()`, and `serverSelectionTimeoutMS` is 5000. Restore the correct URI afterwards.

## 28. Production improvements

Not implemented here, listed as the next steps:

- **HTTPS everywhere** (TLS at a reverse proxy or the platform), and set `app.set("trust proxy", ...)` correctly so rate limiting sees real client IPs.
- **Tokens in HttpOnly cookies**: `HttpOnly` (JavaScript can't read it, which limits XSS theft), `Secure` (HTTPS only), `SameSite=Lax` or `Strict` (cookie isn't sent on cross-site requests). Cookie based auth then needs **CSRF** protection (SameSite plus CSRF tokens for risky requests). `cookie-parser` is already installed for this.
- **Secret management**: secrets in a vault or the hosting platform's secret store, rotated regularly, never in the repo.
- **Password reset** and **email verification** flows with single-use, expiring tokens.
- **Account lockout / progressive delays** per account, not only per IP.
- **Audit logging** of logins, role changes and admin actions.
- **Token reuse detection**: when a revoked refresh token is presented, revoke the whole token family of that user and force a new login (a reused token usually means theft).
- **Monitoring and structured logging** (JSON logs with request ids, alerts on spikes of 401/403/429).
- **Security testing**: automated tests, dependency audits (`npm audit`), penetration testing.
- **Stricter CORS**: exact list of production origins only.
- **Reverse proxy and load balancing** (Nginx, a cloud load balancer) with request size limits and timeouts.
- **Redis** (only if needed) as a shared store for rate limits, and for denylisting access tokens.
- **Distributed rate limiting**: the current limiter is per process in memory. With several servers each one counts separately and a restart resets it.
- A real role/permission model if you need more than two roles.

## 29. Security limitations of this POC

- Tokens are returned in JSON and kept in JavaScript memory. They disappear on page reload and they can still be stolen by XSS while the page is open. HttpOnly cookies are safer (section 28).
- **Access tokens can't be revoked.** After logout, the access token works until it expires (max 15 minutes). The user check in `authenticateToken` limits the risk for disabled/deleted users but not for logged-out ones.
- Reusing a revoked refresh token only returns 401, it doesn't revoke the whole session family.
- Rate limiting is in memory and per IP only.
- No HTTPS, password reset, email verification, MFA or account lockout.
- The seeded passwords are public (they are in this README). Never seed those in a real database.
- Atlas is configured for convenience while learning (broad IP access). Lock it down for real data.
- There are no automated tests, only the manual checklist above.

**This project is a learning POC. Do not deploy it to production as is.**
