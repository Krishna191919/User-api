# Code Explanation for Beginners

This is a **Node.js + Express API** for managing users. Think of it as a backend service that can create, read, update, and delete user data via HTTP requests.

## Project Structure

The code is organized by functionality, not by file type. Here's the high-level view:

```
src/
├── app.js              # Creates the Express app configures middleware and routes
├── server.js           # Starts the server and handles graceful shutdown
├── config/             # Environment configuration
│   └── env.js          # Reads environment variables (port, host, mode)
├── routes/             # URL endpoints
│   └── users.routes.js # All user-related API endpoints
├── controllers/        # Business logic handlers
│   └── users.controller.js # Create, list, get, update, delete users
├── services/           # Core business rules
│   └── users.services.js # User logic, password hashing, validation
├── middleware/         # Pre/post-processing hooks
│   ├── error-handler.js    # Converts errors to JSON error responses
│   ├── not-found.js      # 404 handler for unmatched routes
│   ├── request-id.js     # Adds unique ID to each request
│   ├── request-logger.js # Logs request details (method, path, status, time)
│   └── validate-body.js  # Validates incoming JSON data against schemas
├── validators/         # Input validation rules
│   ├── user.schema.js    # Field rules for creating/updating users
│   ├── rules.js        # Primitive checkers (string, email, password, etc.)
│   └── validate.js       # Main validation orchestrator
├── utils/              # Reusable utilities
│   ├── http-error.js     # Error class with HTTP status codes
│   ├── password.js       # Password hashing (using scrypt)
│   └── query.js          # Pagination, sorting, and link generation
└── utils/              # Reusable utilities
    ├── http-error.js     # Error class with HTTP status codes
    ├── password.js       # Password hashing (using scrypt)
    └── query.js          # Pagination, sorting, and link generation
```

## How Requests Flow Through the System

When a request comes in (e.g., `GET /api/v1/users`), here's what happens step-by-step:

### 1. **Entry Point** (`server.js`)
- Creates the Express app using `createApp()`
- Starts listening on configured port/host
- Sets up graceful shutdown on SIGTERM/SIGINT

### 2. **App Setup** (`app.js`)
The app uses **middleware** - functions that run in sequence for every request:

**Pre-route middleware** (runs first):
- `requestId`: Generates/captures a unique request ID for correlation
- `requestLogger` (only in non-test mode): Logs how long the request took
- `express.json()`: Parses the JSON request body
- Configures body size limit

**Routes** (middle section):
- `GET /health` - Health check endpoint
- `GET /api/v1/users` - List users (with search, filtering, pagination)
- `GET /api/v1/users/:id` - Get single user by ID
- `POST /api/v1/users` - Create a new user (with validation)
- `PATCH /api/v1/users/:id` - Partially update a user (with validation)
- `DELETE /api/v1/users/:id` - Delete a user

**Fallback middleware** (runs last):
- `notFoundHandler`: Returns 404 if no route matched
- `errorHandler`: Converts any error to a proper JSON error response

### 3. **Controllers** (Business Logic)
Controllers handle specific endpoints. For example, `users.controller.js`:

- `list`: Gets all users, supports search (`?q=`), filtering by role, sorting, and pagination
- `getById`: Gets one user by ID, throws 404 if not found
- `create`: Creates a new user - **hashes the password** for security
- `update`: Updates a user - validates email uniqueness
- `remove`: Deletes a user

### 4. **Services** (Core Logic)
`users.services.js` contains the main business rules:

- **`toPublicUser`**: Strips the password hash before sending data to the client (security!)
- **`list`**: Filters, sorts, and paginates users
- **`create`**: Creates user with default role="customer", hashes password
- **`update`**: Updates user data, validates email uniqueness
- **`remove`**: Deletes user
- **`#assertEmailAvailable`**: Private method to check if email already exists

### 5. **Validators** (Input Validation)
Prevents bad data from entering the system:

- **`user.schema.js`**: Defines which fields are allowed and their rules
  - Fields like `firstName`, `lastName`, `email`, `password` are required
  - `role` is deliberately NOT here - clients cannot choose their own role
  - New users are always "customer" role
- **`rules.js`**: Primitive checkers:
  - `string`: min/max length
  - `email`: format validation
  - `password`: must be 8-72 chars with at least 1 letter + 1 digit
  - `phone`: format validation
  - `pastDate`: must be a real date in YYYY-MM-DD format in the past
  - `object`: validates nested objects against a shape
- **`validate.js`**: Orchestrates validation against a schema
  - Rejects unknown fields (prevents "mass assignment")
  - Handles `partial` updates (for PATCH requests)
  - Returns cleaned data with transforms applied (e.g., trim, lowercase)

### 6. **Configuration** (`env.js`)
- Reads from `process.env` environment variables
- Defaults: port 3000, host 127.0.0.1, env "development"
- `isTest` flag: skips request logger in test mode
- `bodyLimit`: defaults to "100kb"

### 7. **Utilities** (`utils/`)

- **`http-error.js`**: `HttpError` class that carries status code, title, and detail
  - Used throughout for consistent error responses
  - `badRequest`, `notFound`, `conflict` helper functions
- **`password.js`**: Password hashing using Node's built-in `scrypt`
  - Generates salt + hash, stores as `scrypt$salt$hash`
  - `verifyPassword` can check a password against stored hash
- **`query.js`**: Pagination and sorting helpers
  - `parsePagination`: Converts `?page=2&limit=10` to `{page: 2, limit: 10}`
  - `sortItems`: Sorts array by field, supports ascending/descending with whitelist
  - `paginate`: Slices array to one page, returns `data` + `meta` (total, totalPages)
  - `pageLinks`: Generates self/next/prev links preserving query params

## Key Design Decisions

1. **Arrow functions in controllers** (`list = async (req, res) => { ... }`): Ensures `this` works correctly when Express calls them as callbacks

2. **`toPublicUser` function**: Always strips `passwordHash` from data sent to clients - **never expose passwords!**

3. **Role system**: 
   - New users are always `"customer"` 
   - `ROLES = ["customer", "admin"]` defined in service
   - Topic 2.3 will add admin-only endpoint to change roles

4. **Validation order**: 
   - Schema validates known fields
   - Unknown fields are rejected (security: prevents sending `{"role": "admin"}` to change role)

5. **Pagination**: 
   - Uses `?page=N&limit=N` query parameters
   - Default limit is 20, max is 100
   - `pageLinks` generates navigation links that preserve sort/filter params

## Running the Project

```bash
# Install dependencies
npm install

# Development mode (auto-reloads on changes)
npm run dev

# Start server
npm start
```

The API will be available at `http://127.0.0.1:3000`

## Typical API Calls

- `GET http://localhost:3000/health` → `{status: "ok", uptimeSec: 123}`
- `GET http://localhost:3000/api/v1/users` → List users with pagination
- `GET http://localhost:3000/api/v1/users?search=john` → Search users
- `POST http://localhost:3000/api/v1/users` → Create user (JSON body with name, email, password)
- `PATCH http://localhost:3000/api/v1/users/5` → Update user (JSON with fields to change)