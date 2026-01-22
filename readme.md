<details>

<summary><strong>Express.js Middleware and Error Handlers Guide</summary></strong>

## Understanding Route Handlers and Middleware

### Multiple Route Handlers on One Route

Express allows you to attach multiple route handlers to a single route. These handlers execute sequentially, and you control the flow using the `next()` function.

## The `next()` Function

The `next()` function is crucial for middleware chaining:
- **Calling `next()`**: Passes control to the next handler in the chain
- **Not calling `next()`**: Stops the middleware chain at the current handler
- **Important**: You can only send ONE response per request

## Common Mistakes and Errors

### ❌ Mistake 1: Sending Response Before Calling `next()`
```javascript
app.use("/user", (req, res, next) => {
    res.send("Response 1!");  // Response sent here
    next();                   // Tries to continue to next handler
}, (req, res) => {
    res.send("Response 2");   // ERROR: Can't send another response!
});
```

**Problem**: Once you send a response with `res.send()`, you cannot send another response. The second handler will cause an error: `Error: Cannot set headers after they are sent to the client`

### ❌ Mistake 2: Calling `next()` After Sending Response
```javascript
app.use("/user", (req, res, next) => {
    next();                   // Continues to next handler first
    res.send("Response 1!");  // Then tries to send response
}, (req, res) => {
    res.send("Response 2");   // This sends first (ERROR potential)
});
```

**Problem**: The execution order becomes confusing. The second handler sends "Response 2", then control returns and tries to send "Response 1", causing the same error.

## ✅ Correct Patterns

### Pattern 1: Middleware Then Response
```javascript
app.use("/user", (req, res, next) => {
    // Do some middleware work (logging, validation, etc.)
    console.log("Processing request...");
    next();  // Pass to next handler
}, (req, res) => {
    // Send the final response
    res.send("Response from final handler");
});
```

### Pattern 2: Conditional Routing
```javascript
app.use("/user", (req, res, next) => {
    if (req.query.admin) {
        res.send("Admin response");  // Send and stop
    } else {
        next();  // Continue to next handler
    }
}, (req, res) => {
    res.send("Regular user response");
});
```

### Pattern 3: Middleware with Data Passing
```javascript
app.use("/user", (req, res, next) => {
    // Attach data to request object
    req.customData = "Some processed data";
    next();  // Pass control forward
}, (req, res) => {
    // Use the data from previous middleware
    res.send(`Response with ${req.customData}`);
});
```

## Key Rules to Remember

1. **One Response Per Request**: You can only call `res.send()`, `res.json()`, `res.render()`, etc. ONCE per request

2. **Call `next()` OR Send Response**: In each handler, either:
   - Call `next()` to pass control forward (don't send response)
   - Send a response (don't call `next()`)
   - Do both conditionally (but never both unconditionally)

3. **Order Matters**: Handlers execute in the order they're defined

4. **Return After Response**: It's good practice to `return` after sending a response to prevent further code execution:
```javascript
   if (error) {
       return res.status(400).send("Error");
   }
   next();
```

## Practical Example: Authentication Middleware
```javascript
// Authentication middleware
app.use("/protected", (req, res, next) => {
    const token = req.headers.authorization;
    
    if (!token) {
        return res.status(401).send("Unauthorized");
    }
    
    // Verify token (simplified)
    if (token === "valid-token") {
        req.user = { id: 1, name: "John" };
        next();  // User is authenticated, continue
    } else {
        res.status(403).send("Invalid token");
    }
}, (req, res) => {
    // This only executes if authentication passed
    res.send(`Welcome ${req.user.name}`);
});
```

## Error Handling Middleware

Error handlers have a special signature with four parameters:
```javascript
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});
```

Pass errors to error handlers using `next(error)`:
```javascript
app.use("/user", (req, res, next) => {
    const error = new Error("Something failed");
    next(error);  // Skips regular handlers, goes to error handler
}, (req, res) => {
    res.send("This won't execute if error occurred");
});
```

## Multiple Route Handlers - Complete Example
```javascript
const express = require('express');
const app = express();

// Example 1: Logging middleware + Response
app.use("/user", 
    (req, res, next) => {
        console.log("First handler - logging");
        next();
    }, 
    (req, res) => {
        res.send("Response from second handler");
    }
);

// Example 2: Authentication + Authorization + Response
app.use("/admin",
    (req, res, next) => {
        // Authentication
        if (req.headers.token) {
            req.authenticated = true;
            next();
        } else {
            res.status(401).send("Not authenticated");
        }
    },
    (req, res, next) => {
        // Authorization
        if (req.authenticated && req.headers.role === 'admin') {
            next();
        } else {
            res.status(403).send("Not authorized");
        }
    },
    (req, res) => {
        res.send("Admin panel");
    }
);

// Example 3: Data validation + Processing + Response
app.use("/submit",
    (req, res, next) => {
        // Validation
        if (!req.body.data) {
            return res.status(400).send("Missing data");
        }
        next();
    },
    (req, res, next) => {
        // Processing
        req.processedData = req.body.data.toUpperCase();
        next();
    },
    (req, res) => {
        res.send(`Processed: ${req.processedData}`);
    }
);

app.listen(3000);
```

## Summary

- Multiple handlers provide powerful request processing chains
- Use `next()` to pass control between handlers
- Only send ONE response per request
- Order your code carefully: either call `next()` OR send a response
- Use middleware for cross-cutting concerns (logging, auth, validation)
- Error handlers catch issues throughout your middleware chain

## Quick Reference

| Action | Result |
|--------|--------|
| `next()` | Continue to next handler |
| `res.send()` | Send response and end chain |
| `next(error)` | Skip to error handler |
| `res.send() + next()` | ❌ ERROR - Cannot send multiple responses |
| `return res.send()` | ✅ Send response and prevent further execution |

## Common Error Messages

- **"Cannot set headers after they are sent to the client"**: You tried to send multiple responses
- **"Cannot read property of undefined"**: You forgot to call `next()` and the expected data wasn't passed
- **Request hangs/times out**: You forgot to call `next()` or send a response
</details>


<details>

<summary><strong>Mongoose Setup and Database Connectivity Guide</summary></strong>





## Table of Contents
- [Installation](#installation)
- [Database Connection](#database-connection)
- [Creating Schemas](#creating-schemas)
- [Creating Models](#creating-models)
- [Model Methods and CRUD Operations](#model-methods-and-crud-operations)
- [Best Practices](#best-practices)

## Installation

First, install the required packages:
```bash
npm install express mongoose
```

## Database Connection

### Step 1: Create Database Configuration File

Create a file `config/database.js`:
```javascript
const mongoose = require("mongoose");

const connectDB = async () => {
    await mongoose.connect("mongodb+srv://username:password@cluster.mongodb.net/databaseName");
}

module.exports = connectDB;
```

**Important Notes:**
- Replace `username`, `password`, `cluster`, and `databaseName` with your actual MongoDB credentials
- Never hardcode credentials in production - use environment variables instead
- The connection string format: `mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>`

### Step 2: Environment Variables (Recommended)

Create a `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/databaseName
PORT=8888
```

Update `config/database.js`:
```javascript
const mongoose = require("mongoose");
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

module.exports = connectDB;
```

## Creating Schemas

### What is a Schema?

A schema defines the structure of documents within a MongoDB collection. It specifies:
- Field names
- Data types
- Validation rules
- Default values
- Required fields

### Basic Schema Example

Create a file `models/user.js`:
```javascript
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    emailId: {
        type: String,
    },
    password: {
        type: String,
    },
    age: {
        type: Number,
    },
    gender: {
        type: String,
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
```

### Schema with Validation and Options
```javascript
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minLength: 2,
        maxLength: 50,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    age: {
        type: Number,
        min: 18,
        max: 100
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        lowercase: true
    },
    profilePicture: {
        type: String,
        default: 'default-avatar.png'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true  // Adds createdAt and updatedAt fields automatically
});

const User = mongoose.model("User", userSchema);

module.exports = User;
```

### Common Schema Data Types
```javascript
const exampleSchema = new mongoose.Schema({
    stringField: String,
    numberField: Number,
    dateField: Date,
    booleanField: Boolean,
    arrayField: [String],
    objectIdField: mongoose.Schema.Types.ObjectId,
    mixedField: mongoose.Schema.Types.Mixed,
    bufferField: Buffer,
    mapField: Map,
    decimalField: mongoose.Schema.Types.Decimal128
});
```

### Schema Validation Options

| Option | Description | Example |
|--------|-------------|---------|
| `required` | Field must be provided | `required: true` |
| `unique` | Field value must be unique | `unique: true` |
| `min/max` | Minimum/Maximum value (Number/Date) | `min: 18, max: 100` |
| `minLength/maxLength` | Min/Max string length | `minLength: 6` |
| `trim` | Remove whitespace | `trim: true` |
| `lowercase/uppercase` | Convert to lowercase/uppercase | `lowercase: true` |
| `enum` | Allowed values only | `enum: ['male', 'female']` |
| `match` | Regex pattern validation | `match: /regex/` |
| `default` | Default value if not provided | `default: true` |

## Creating Models

### What is a Model?

A model is a wrapper for the schema that provides an interface to the database for creating, querying, updating, and deleting documents.

### Model Naming Convention
```javascript
// Model names should be:
// 1. Singular (User, not Users)
// 2. Start with capital letter
// 3. Use PascalCase

const User = mongoose.model("User", userSchema);      // ✅ Correct
const Product = mongoose.model("Product", productSchema);  // ✅ Correct

const users = mongoose.model("users", userSchema);    // ❌ Wrong
const product = mongoose.model("product", productSchema);  // ❌ Wrong
```

**Note**: MongoDB will automatically create a collection with the pluralized, lowercase version of the model name (User → users, Product → products)

## Model Methods and CRUD Operations

### Setup Express Server
```javascript
const express = require("express");
const connectDB = require("./config/database");
const User = require("./models/user");

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Connect to database then start server
connectDB()
    .then(() => {
        console.log("Database connection established!");
        app.listen(8888, () => {
            console.log("Server is successfully running on port 8888");
        });
    })
    .catch(err => {
        console.error("Error connecting to database:", err);
    });
```

### CREATE - Adding Documents

#### Method 1: Using `new Model()` and `save()`
```javascript
app.post("/signup", async (req, res) => {
    // Create new user instance
    const user = new User(req.body);
    
    try {
        await user.save();  // Saves to database
        res.send("User added successfully");
    } catch (error) {
        res.status(400).send("Error saving the user: " + error.message);
    }
});
```

#### Method 2: Using `Model.create()`
```javascript
app.post("/signup", async (req, res) => {
    try {
        const user = await User.create(req.body);
        res.status(201).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(400).send("Error saving the user: " + error.message);
    }
});
```

#### Method 3: Using `insertMany()` for Multiple Documents
```javascript
app.post("/signup/bulk", async (req, res) => {
    try {
        const users = await User.insertMany(req.body.users);
        res.status(201).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(400).send("Error saving users: " + error.message);
    }
});
```

### READ - Finding Documents

#### Find One User by Email
```javascript
app.get("/user", async (req, res) => {
    const userEmail = req.body.emailId;
    
    try {
        const user = await User.find({ emailId: userEmail });
        
        if (user.length === 0) {
            return res.status(404).send("User not found!");
        }
        
        res.status(200).send(user);
    } catch (error) {
        res.status(400).send("Something went wrong!");
    }
});
```

#### Better Approach - Using `findOne()`
```javascript
app.get("/user", async (req, res) => {
    const userEmail = req.body.emailId;
    
    try {
        const user = await User.findOne({ emailId: userEmail });
        
        if (!user) {
            return res.status(404).send("User not found!");
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(400).send("Something went wrong!");
    }
});
```

#### Find by ID
```javascript
app.get("/user/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).send("User not found!");
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(400).send("Invalid user ID!");
    }
});
```

#### Get All Users (Feed)
```javascript
app.get("/feed", async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(400).send("Something went wrong!");
    }
});
```

#### Advanced Queries
```javascript
// Find with multiple conditions
app.get("/users/search", async (req, res) => {
    try {
        const users = await User.find({
            age: { $gte: 18, $lte: 30 },
            gender: "male",
            isActive: true
        });
        res.status(200).json(users);
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
});

// Find with select (specific fields only)
app.get("/users/names", async (req, res) => {
    try {
        const users = await User.find({})
            .select('firstName lastName emailId')
            .limit(10);
        res.status(200).json(users);
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
});

// Find with sorting
app.get("/users/sorted", async (req, res) => {
    try {
        const users = await User.find({})
            .sort({ createdAt: -1 })  // -1 for descending, 1 for ascending
            .limit(20);
        res.status(200).json(users);
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
});

// Pagination
app.get("/users/page/:page", async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    try {
        const users = await User.find({})
            .skip(skip)
            .limit(limit);
        
        const total = await User.countDocuments();
        
        res.status(200).json({
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            data: users
        });
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
});
```

### UPDATE - Modifying Documents

#### Using `findByIdAndUpdate()`
```javascript
app.patch("/user/:id", async (req, res) => {
    const userId = req.params.id;
    const data = req.body;
    
    try {
        const user = await User.findByIdAndUpdate(
            userId,
            data,
            { 
                new: true,           // Return updated document
                runValidators: true  // Run schema validations
            }
        );
        
        if (!user) {
            return res.status(404).send("User not found!");
        }
        
        res.send("User updated successfully!");
    } catch (error) {
        res.status(400).send("Something went wrong: " + error.message);
    }
});
```

#### Using `findOneAndUpdate()`
```javascript
app.patch("/user", async (req, res) => {
    const { emailId, ...updateData } = req.body;
    
    try {
        const user = await User.findOneAndUpdate(
            { emailId: emailId },
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!user) {
            return res.status(404).send("User not found!");
        }
        
        res.json({
            message: "User updated successfully!",
            data: user
        });
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
});
```

#### Using `updateOne()` and `updateMany()`
```javascript
// Update one document
app.patch("/user/status/:id", async (req, res) => {
    try {
        const result = await User.updateOne(
            { _id: req.params.id },
            { isActive: req.body.isActive }
        );
        
        res.json({
            message: "Status updated",
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
});

// Update multiple documents
app.patch("/users/deactivate", async (req, res) => {
    try {
        const result = await User.updateMany(
            { age: { $lt: 18 } },
            { isActive: false }
        );
        
        res.json({
            message: "Users updated",
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
});
```

### DELETE - Removing Documents

#### Using `findByIdAndDelete()`
```javascript
app.delete("/user/:id", async (req, res) => {
    const userId = req.params.id;
    
    try {
        const user = await User.findByIdAndDelete(userId);
        
        if (!user) {
            return res.status(404).send("User not found!");
        }
        
        res.send("User deleted successfully");
    } catch (error) {
        res.status(400).send("Something went wrong!");
    }
});
```

#### Using `findOneAndDelete()`
```javascript
app.delete("/user", async (req, res) => {
    const userEmail = req.body.emailId;
    
    try {
        const user = await User.findOneAndDelete({ emailId: userEmail });
        
        if (!user) {
            return res.status(404).send("User not found!");
        }
        
        res.json({
            message: "User deleted successfully",
            deletedUser: user
        });
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
});
```

#### Using `deleteOne()` and `deleteMany()`
```javascript
// Delete one document
app.delete("/user/email/:email", async (req, res) => {
    try {
        const result = await User.deleteOne({ emailId: req.params.email });
        
        if (result.deletedCount === 0) {
            return res.status(404).send("User not found!");
        }
        
        res.send("User deleted successfully");
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
});

// Delete multiple documents
app.delete("/users/inactive", async (req, res) => {
    try {
        const result = await User.deleteMany({ isActive: false });
        
        res.json({
            message: "Inactive users deleted",
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
});
```

## Model Methods Summary

### Create Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `new Model(data).save()` | Create and save instance | Saved document |
| `Model.create(data)` | Create one document | Created document |
| `Model.insertMany([data])` | Create multiple documents | Array of documents |

### Read Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `Model.find(query)` | Find all matching documents | Array |
| `Model.findOne(query)` | Find first matching document | Document or null |
| `Model.findById(id)` | Find by ID | Document or null |
| `Model.countDocuments(query)` | Count matching documents | Number |
| `Model.exists(query)` | Check if document exists | Boolean |

### Update Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `Model.findByIdAndUpdate(id, data, options)` | Find by ID and update | Updated document |
| `Model.findOneAndUpdate(query, data, options)` | Find one and update | Updated document |
| `Model.updateOne(query, data)` | Update first match | Update result |
| `Model.updateMany(query, data)` | Update all matches | Update result |

### Delete Operations

| Method | Description | Returns |
|--------|-------------|---------|
| `Model.findByIdAndDelete(id)` | Find by ID and delete | Deleted document |
| `Model.findOneAndDelete(query)` | Find one and delete | Deleted document |
| `Model.deleteOne(query)` | Delete first match | Delete result |
| `Model.deleteMany(query)` | Delete all matches | Delete result |

## Query Options

### Common Options for Find Methods
```javascript
// Select specific fields
User.find().select('firstName lastName emailId');
User.find().select('-password');  // Exclude password

// Limit results
User.find().limit(10);

// Skip results (for pagination)
User.find().skip(20);

// Sort results
User.find().sort({ createdAt: -1 });  // -1 descending, 1 ascending
User.find().sort('-createdAt');       // Alternative syntax

// Combine options
User.find()
    .select('firstName lastName')
    .limit(10)
    .skip(20)
    .sort({ age: 1 });
```

### Common Options for Update Methods
```javascript
const options = {
    new: true,           // Return updated document instead of original
    runValidators: true, // Run schema validators on update
    upsert: false        // Create document if it doesn't exist
};

User.findByIdAndUpdate(id, data, options);
```

## Query Operators

### Comparison Operators
```javascript
// $eq - Equal to
User.find({ age: { $eq: 25 } });
User.find({ age: 25 });  // Same as above

// $ne - Not equal to
User.find({ gender: { $ne: 'male' } });

// $gt - Greater than
User.find({ age: { $gt: 18 } });

// $gte - Greater than or equal to
User.find({ age: { $gte: 18 } });

// $lt - Less than
User.find({ age: { $lt: 60 } });

// $lte - Less than or equal to
User.find({ age: { $lte: 60 } });

// $in - In array
User.find({ gender: { $in: ['male', 'female'] } });

// $nin - Not in array
User.find({ status: { $nin: ['banned', 'suspended'] } });
```

### Logical Operators
```javascript
// $and
User.find({
    $and: [
        { age: { $gte: 18 } },
        { age: { $lte: 60 } }
    ]
});

// $or
User.find({
    $or: [
        { emailId: 'test@example.com' },
        { phone: '1234567890' }
    ]
});

// $not
User.find({ age: { $not: { $lt: 18 } } });

// $nor
User.find({
    $nor: [
        { status: 'banned' },
        { isActive: false }
    ]
});
```

### Element Operators
```javascript
// $exists - Field exists
User.find({ profilePicture: { $exists: true } });

// $type - Field type
User.find({ age: { $type: 'number' } });
```

## Best Practices

### 1. Always Use Try-Catch Blocks
```javascript
app.get("/user/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

### 2. Use Environment Variables

Never hardcode sensitive data:
```javascript
// ❌ Bad
await mongoose.connect("mongodb+srv://user:pass@cluster.mongodb.net/db");

// ✅ Good
await mongoose.connect(process.env.MONGODB_URI);
```

### 3. Connect to Database Before Starting Server
```javascript
// ✅ Correct order
connectDB()
    .then(() => {
        app.listen(8888, () => {
            console.log("Server running on port 8888");
        });
    })
    .catch(err => console.error("Database connection failed:", err));

// ❌ Wrong - server starts even if DB connection fails
app.listen(8888);
connectDB();
```

### 4. Use Proper HTTP Status Codes
```javascript
// 200 - OK (successful GET, PATCH, PUT, DELETE)
// 201 - Created (successful POST)
// 400 - Bad Request (validation errors)
// 404 - Not Found (resource doesn't exist)
// 500 - Internal Server Error (server/database errors)

res.status(201).json(user);      // Created
res.status(404).send("Not found"); // Not found
res.status(400).send("Invalid");   // Bad request
```

### 5. Use Validation in Schema
```javascript
const userSchema = new mongoose.Schema({
    emailId: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    }
});
```

### 6. Index Frequently Queried Fields
```javascript
const userSchema = new mongoose.Schema({
    emailId: {
        type: String,
        unique: true,
        index: true  // Creates index for faster queries
    }
});
```

### 7. Don't Return Sensitive Data
```javascript
// Exclude password from responses
const userSchema = new mongoose.Schema({
    password: {
        type: String,
        required: true,
        select: false  // Won't be returned by default
    }
});

// Or manually exclude
app.get("/user/:id", async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');
    res.json(user);
});
```

### 8. Use Lean Queries for Better Performance
```javascript
// Returns plain JavaScript objects instead of Mongoose documents
// Faster and uses less memory
const users = await User.find({}).lean();
```

### 9. Handle Mongoose Connection Events
```javascript
const mongoose = require('mongoose');

mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
    console.log('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    process.exit(0);
});
```

### 10. Use Timestamps
```javascript
const userSchema = new mongoose.Schema({
    // ... fields
}, {
    timestamps: true  // Automatically adds createdAt and updatedAt
});
```

## Project Structure
```
project/
├── config/
│   └── database.js       # Database connection
├── models/
│   ├── user.js          # User schema and model
│   ├── product.js       # Product schema and model
│   └── order.js         # Order schema and model
├── routes/
│   ├── userRoutes.js    # User-related routes
│   ├── productRoutes.js # Product-related routes
│   └── orderRoutes.js   # Order-related routes
├── controllers/
│   ├── userController.js    # User business logic
│   ├── productController.js # Product business logic
│   └── orderController.js   # Order business logic
├── middleware/
│   ├── auth.js          # Authentication middleware
│   └── errorHandler.js  # Error handling middleware
├── .env                 # Environment variables
├── .gitignore          # Git ignore file
├── package.json        # Dependencies
└── server.js           # Main application file
```

## Common Errors and Solutions

### Error: "Cannot set headers after they are sent"
```javascript
// ❌ Wrong - missing return
if (!user) {
    res.status(404).send("Not found");
}
res.send(user);  // This still executes!

// ✅ Correct
if (!user) {
    return res.status(404).send("Not found");
}
res.send(user);
```

### Error: "Cast to ObjectId failed"
```javascript
// Invalid MongoDB ObjectId format
// Make sure ID is valid before querying
const mongoose = require('mongoose');

if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).send("Invalid user ID");
}
```

### Error: "E11000 duplicate key error"
```javascript
// Trying to insert duplicate value for unique field
// Handle this error properly
try {
    await user.save();
} catch (error) {
    if (error.code === 11000) {
        return res.status(400).send("Email already exists");
    }
    res.status(500).send("Server error");
}
```

## Additional Resources

- [Mongoose Official Documentation](https://mongoosejs.com/docs/)
- [MongoDB Query Operators](https://www.mongodb.com/docs/manual/reference/operator/query/)
- [Mongoose Schema Types](https://mongoosejs.com/docs/schematypes.html)
- [Mongoose Validation](https://mongoosejs.com/docs/validation.html)


Document (entry) => Collection (table user) => Database (devTinder)

</details>

<details>
<strong><summary>Data Sanitization & Schema Validations</summary><strong>
if we specify required true and if we dont send that field, then mongoose will not allow insertion into that data base

unique -> text [Avoids duplicate records]
</details>



## Password Encryption with bcrypt in Node.js

short summary : 
Encrypting passwords

- Passwords should be stored in a hash format, no one should be able to see the password in the db
- Encrypted password
- To encrypt the password we use a package known as bcrypt
- bcrypt.hash returns a promise
- To hash a password we need an decryption algorithm

When you use bcrypt.hash it crwates a hash using the salt and a plain password and how many number of rounds that salt should be applied to create the password, the more the no. of salt rounds the tougher the password to decrypt

When you encrypt a password
    - you need a salt (random string)
    -Now you take the plain password and the salt and then you do the multiple rounds of encryption
<details>
<summary><strong>📖 Password Encryption with bcrypt in Node.js</strong></summary>

<details>
<summary><strong>Table of Contents</strong></summary>

- [Why Encrypt Passwords?](#why-encrypt-passwords)
- [What is bcrypt?](#what-is-bcrypt)
- [Installation](#installation)
- [How bcrypt Works](#how-bcrypt-works)
- [Hashing Passwords](#hashing-passwords)
- [Comparing Passwords](#comparing-passwords)
- [Complete Authentication Example](#complete-authentication-example)
- [Best Practices](#best-practices)
- [Common Mistakes](#common-mistakes)
- [Security Checklist](#security-checklist)
- [bcrypt Methods Reference](#bcrypt-methods-reference)
- [Testing Password Hashing](#testing-password-hashing)
- [Additional Resources](#additional-resources)

</details>

---

<details>
<summary><strong>Why Encrypt Passwords?</strong></summary>


**NEVER store plain text passwords in your database!**

### Problems with Plain Text Passwords:
- ❌ Database administrators can see passwords
- ❌ If database is compromised, all passwords are exposed
- ❌ Users often reuse passwords across multiple sites
- ❌ Legal and compliance issues (GDPR, etc.)

### Solution: Password Hashing
- ✅ Passwords are converted to irreversible hash strings
- ✅ Even if database is compromised, original passwords are safe
- ✅ No one (including admins) can see actual passwords
- ✅ Industry standard security practice

</details>

---

<details>
<summary><strong>What is bcrypt?</strong></summary>

**bcrypt** is a password hashing function designed specifically for securely storing passwords.

### Key Features:
- **One-way hashing**: Cannot be decrypted back to original password
- **Salt generation**: Adds random data to prevent rainbow table attacks
- **Configurable cost factor**: Can adjust computational difficulty
- **Slow by design**: Makes brute-force attacks impractical

</details>

---

<details>
<summary><strong>Installation</strong></summary>
```bash
npm install bcrypt
```

For validation (optional but recommended):
```bash
npm install validator
```

</details>

---

<details>
<summary><strong>How bcrypt Works</strong></summary>

### The Hashing Process
```
Plain Password + Salt + Rounds = Hash
```

1. **Salt**: A random string added to the password
2. **Rounds**: Number of times the hashing algorithm is applied (default: 10)
3. **Hash**: The final encrypted password stored in database

### Example:
```javascript
Plain Password: "myPassword123"
Salt: "$2b$10$N9qo8uLOickgx2ZMRZoMye"
Rounds: 10
Hash: "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
```

### Understanding Salt Rounds

| Rounds | Time to Hash | Security Level |
|--------|--------------|----------------|
| 8 | ~40ms | Minimum acceptable |
| 10 | ~100ms | **Recommended** |
| 12 | ~400ms | High security |
| 14 | ~1.6s | Very high security |

**Recommendation**: Use 10 rounds for most applications. Higher rounds = more secure but slower.

</details>

---

<details>
<summary><strong>Hashing Passwords</strong></summary>

### Method 1: Using `bcrypt.hash()` (Recommended)
```javascript
const bcrypt = require("bcrypt");

// Hash a password
const saltRounds = 10;
const plainPassword = "myPassword123";

const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
console.log(hashedPassword);
// Output: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

### Method 2: Manual Salt Generation (Less Common)
```javascript
const bcrypt = require("bcrypt");

// Generate salt first, then hash
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(plainPassword, salt);
```

### During User Signup
```javascript
const bcrypt = require("bcrypt");
const User = require("./models/user");

app.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, emailId, password } = req.body;
        
        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user with hashed password
        const user = new User({
            firstName,
            lastName,
            emailId,
            password: hashedPassword  // Store hashed password
        });
        
        await user.save();
        res.status(201).send("User created successfully!");
        
    } catch (error) {
        res.status(400).send("Error: " + error.message);
    }
});
```

### Using Mongoose Schema Middleware (Advanced)
```javascript
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    emailId: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
});

// Hash password before saving
userSchema.pre("save", async function(next) {
    // Only hash if password is modified or new
    if (!this.isModified("password")) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.model("User", userSchema);
module.exports = User;
```

</details>

---

<details>
<summary><strong>Comparing Passwords</strong></summary>

### How Password Verification Works

You **CANNOT** decrypt a hashed password. Instead, you:
1. Take the plain password from login attempt
2. Hash it using the same algorithm and salt
3. Compare the two hashes

### Using `bcrypt.compare()`
```javascript
const bcrypt = require("bcrypt");

const plainPassword = "myPassword123";
const hashedPassword = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

// Returns true if passwords match, false otherwise
const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

if (isMatch) {
    console.log("Password is correct!");
} else {
    console.log("Password is incorrect!");
}
```

### During User Login
```javascript
const bcrypt = require("bcrypt");
const User = require("./models/user");

app.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;
        
        // Find user by email
        const user = await User.findOne({ emailId: emailId });
        
        if (!user) {
            throw new Error("Invalid credentials!");
        }
        
        // Compare plain password with hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (isPasswordValid) {
            res.status(200).send("Login successful!");
        } else {
            throw new Error("Invalid credentials!");
        }
        
    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }
});
```

</details>

---

<details>
<summary><strong>Complete Authentication Example</strong></summary>

### User Model with Validation
```javascript
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        minLength: 2,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: validator.isEmail,
            message: "Invalid email format"
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    age: {
        type: Number,
        min: 18
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return next();
    }
    
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
```

### Signup Route
```javascript
const express = require("express");
const User = require("./models/user");
const validator = require("validator");

const app = express();
app.use(express.json());

app.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, emailId, password, age } = req.body;
        
        // Validate email
        if (!validator.isEmail(emailId)) {
            throw new Error("Invalid email format!");
        }
        
        // Validate password strength
        if (!validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        })) {
            throw new Error("Password must be at least 8 characters with uppercase, lowercase, number and symbol!");
        }
        
        // Check if user already exists
        const existingUser = await User.findOne({ emailId });
        if (existingUser) {
            throw new Error("Email already registered!");
        }
        
        // Create new user (password will be hashed automatically)
        const user = new User({
            firstName,
            lastName,
            emailId,
            password,
            age
        });
        
        await user.save();
        
        res.status(201).json({
            message: "User created successfully!",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                emailId: user.emailId
            }
        });
        
    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }
});
```

### Login Route
```javascript
app.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;
        
        // Validate email format
        if (!validator.isEmail(emailId)) {
            throw new Error("Invalid credentials!");
        }
        
        // Find user by email
        const user = await User.findOne({ emailId: emailId });
        
        if (!user) {
            throw new Error("Invalid credentials!");
        }
        
        // Compare passwords
        const isPasswordValid = await bcrypt.compare(password, user.password);
        // OR using the schema method:
        // const isPasswordValid = await user.comparePassword(password);
        
        if (!isPasswordValid) {
            throw new Error("Invalid credentials!");
        }
        
        // Login successful
        res.status(200).json({
            message: "Login successful!",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                emailId: user.emailId
            }
        });
        
    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }
});
```

### Password Reset Route
```javascript
app.patch("/reset-password", async (req, res) => {
    try {
        const { emailId, oldPassword, newPassword } = req.body;
        
        // Find user
        const user = await User.findOne({ emailId });
        if (!user) {
            throw new Error("User not found!");
        }
        
        // Verify old password
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            throw new Error("Current password is incorrect!");
        }
        
        // Validate new password
        if (!validator.isStrongPassword(newPassword)) {
            throw new Error("New password is not strong enough!");
        }
        
        // Update password (will be hashed automatically by pre-save hook)
        user.password = newPassword;
        await user.save();
        
        res.status(200).send("Password updated successfully!");
        
    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }
});
```

</details>

---

<details>
<summary><strong>Best Practices</strong></summary>

### 1. Always Hash Passwords
```javascript
// ❌ NEVER do this
const user = new User({
    emailId: "test@example.com",
    password: "plainPassword123"  // Plain text password
});

// ✅ Always do this
const hashedPassword = await bcrypt.hash("plainPassword123", 10);
const user = new User({
    emailId: "test@example.com",
    password: hashedPassword  // Hashed password
});
```

### 2. Use Appropriate Salt Rounds
```javascript
// ❌ Too low (insecure)
const hash = await bcrypt.hash(password, 5);

// ✅ Recommended for most applications
const hash = await bcrypt.hash(password, 10);

// ✅ For high-security applications
const hash = await bcrypt.hash(password, 12);
```

### 3. Never Reveal Why Login Failed
```javascript
// ❌ Bad - reveals which part failed
if (!user) {
    throw new Error("User not found!");
}
if (!isPasswordValid) {
    throw new Error("Password is incorrect!");
}

// ✅ Good - generic error message
if (!user || !isPasswordValid) {
    throw new Error("Invalid credentials!");
}
```

### 4. Validate Password Strength
```javascript
const validator = require("validator");

if (!validator.isStrongPassword(password, {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
})) {
    throw new Error("Password must be stronger!");
}
```

### 5. Don't Return Password in API Responses
```javascript
// ❌ Bad
res.json(user);  // Includes hashed password

// ✅ Good - exclude password
const userSchema = new mongoose.Schema({
    password: {
        type: String,
        required: true,
        select: false  // Won't be returned by default
    }
});

// Or manually exclude
res.json({
    id: user._id,
    emailId: user.emailId,
    firstName: user.firstName
    // No password field
});
```

### 6. Use Environment Variables for Salt Rounds
```javascript
// .env file
SALT_ROUNDS=10

// In your code
const bcrypt = require("bcrypt");
require('dotenv').config();

const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
const hash = await bcrypt.hash(password, saltRounds);
```

### 7. Handle Async Operations Properly
```javascript
// ❌ Wrong - not awaiting async function
const hash = bcrypt.hash(password, 10);  // Returns a Promise

// ✅ Correct
const hash = await bcrypt.hash(password, 10);
```

</details>

---

<details>
<summary><strong>Common Mistakes</strong></summary>

### Mistake 1: Comparing Plain Text Passwords
```javascript
// ❌ NEVER do this
if (password === user.password) {
    console.log("Logged in");
}

// ✅ Always use bcrypt.compare()
const isValid = await bcrypt.compare(password, user.password);
if (isValid) {
    console.log("Logged in");
}
```

### Mistake 2: Hashing Already Hashed Passwords
```javascript
// ❌ Wrong - hashing twice
userSchema.pre("save", async function(next) {
    // This will hash the password every time, even if already hashed
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// ✅ Correct - only hash if modified
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
```

### Mistake 3: Not Using Try-Catch
```javascript
// ❌ Wrong - no error handling
app.post("/login", async (req, res) => {
    const isValid = await bcrypt.compare(password, user.password);
    res.send("Success");
});

// ✅ Correct
app.post("/login", async (req, res) => {
    try {
        const isValid = await bcrypt.compare(password, user.password);
        res.send("Success");
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
});
```

### Mistake 4: Synchronous bcrypt Methods in Production
```javascript
// ❌ Avoid in production - blocks event loop
const hash = bcrypt.hashSync(password, 10);
const isValid = bcrypt.compareSync(password, hash);

// ✅ Use async methods
const hash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hash);
```

</details>

---

<details>
<summary><strong>Security Checklist</strong></summary>

- ✅ Never store plain text passwords
- ✅ Use bcrypt with at least 10 salt rounds
- ✅ Validate password strength before hashing
- ✅ Use generic error messages for failed logins
- ✅ Don't return passwords in API responses
- ✅ Implement rate limiting on login endpoints
- ✅ Use HTTPS in production
- ✅ Implement account lockout after multiple failed attempts
- ✅ Add password reset functionality
- ✅ Log authentication attempts for security monitoring

</details>

---

<details>
<summary><strong>bcrypt Methods Reference</strong></summary>

### Hashing

| Method | Description | Usage |
|--------|-------------|-------|
| `bcrypt.hash(password, saltRounds)` | Hash password (async) | `await bcrypt.hash(pwd, 10)` |
| `bcrypt.hashSync(password, saltRounds)` | Hash password (sync) | `bcrypt.hashSync(pwd, 10)` |
| `bcrypt.genSalt(saltRounds)` | Generate salt (async) | `await bcrypt.genSalt(10)` |
| `bcrypt.genSaltSync(saltRounds)` | Generate salt (sync) | `bcrypt.genSaltSync(10)` |

### Comparing


| Method | Description | Usage |
|--------|-------------|-------|
| `bcrypt.compare(password, hash)` | Compare password (async) | `await bcrypt.compare(pwd, hash)` |
| `bcrypt.compareSync(password, hash)` | Compare password (sync) | `bcrypt.compareSync(pwd, hash)` |

</details>

---

<details>
<summary><strong>Testing Password Hashing</strong></summary>

```javascript
const bcrypt = require("bcrypt");

// Test hashing and comparing
async function testBcrypt() {
    const password = "myPassword123";
    
    // Hash the password
    const hash = await bcrypt.hash(password, 10);
    console.log("Original:", password);
    console.log("Hashed:", hash);
    
    // Compare correct password
    const isMatch1 = await bcrypt.compare(password, hash);
    console.log("Correct password:", isMatch1);  // true
    
    // Compare wrong password
    const isMatch2 = await bcrypt.compare("wrongPassword", hash);
    console.log("Wrong password:", isMatch2);  // false
}

testBcrypt();
```

</details>

---

<details>
<summary><strong>Additional Resources</strong></summary>

- [bcrypt npm package](https://www.npmjs.com/package/bcrypt)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [validator npm package](https://www.npmjs.com/package/validator)
- [Mongoose Middleware Documentation](https://mongoosejs.com/docs/middleware.html)

</details>

---

## Summary

- **Never** store passwords in plain text
- Use **bcrypt** to hash passwords before storing
- Use **bcrypt.compare()** to verify passwords during login
- Recommended salt rounds: **10** for most applications
- Always use **async** methods (avoid Sync methods in production)
- Validate password strength before hashing
- Use generic error messages to prevent user enumeration
- Implement additional security measures (rate limiting, account lockout, etc.)

</details>

## Cookies and JWT 

### Short summary: 
Cookie parser Middleware used to parse cookies

const cookieParser = require("cookie-parser");
app.use(cookieParser()); 

JWT token (JSON web token)
- Can contain special information inside them

Token is divided into 3 things
1. Header
2. Payload
3. Signature

To create JWT token "jsonwebtoken" package

Login Flow 

-> Login (email, password)
-> Server validates the credentials, generates JWT token
-> Puts the JWT token inside the cookie
-> Cookie is sent back in the response

jwt.sign, jwt.verify

You can set the expiration of token while signing the token 

jwt.sign(TOKEN, SECRET, EXPIRATION)

{expiresIn: '1h'}
------------------

<details>
<summary><strong>🍪 Cookie Parser & JWT Authentication in Node.js</strong></summary>

<details>
<summary><strong>Table of Contents</strong></summary>

- [What is Cookie Parser?](#what-is-cookie-parser)
- [What is JWT (JSON Web Token)?](#what-is-jwt-json-web-token)
- [JWT Structure](#jwt-structure)
- [Installation](#installation)
- [Login Flow with JWT](#login-flow-with-jwt)
- [Complete Implementation](#complete-implementation)
- [JWT Methods Reference](#jwt-methods-reference)
- [Best Practices](#best-practices)
- [Common Mistakes](#common-mistakes)
- [Security Considerations](#security-considerations)

</details>

---

<details>
<summary><strong>What is Cookie Parser?</strong></summary>

**cookie-parser** is a middleware that parses cookies attached to incoming client requests.

### Why Use Cookie Parser?

Without cookie-parser, you cannot access cookies sent by the client in your Express application.

### Basic Usage
```javascript
const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

// Use cookie-parser middleware
app.use(cookieParser());

// Now you can access cookies via req.cookies
app.get("/test", (req, res) => {
    console.log(req.cookies);  // Access all cookies
    console.log(req.cookies.token);  // Access specific cookie
    res.send("Cookies parsed!");
});
```

### What It Does
```javascript
// Without cookie-parser
req.headers.cookie  // "token=abc123; user=john"  (string)

// With cookie-parser
req.cookies  // { token: "abc123", user: "john" }  (object)
```

</details>

---

<details>
<summary><strong>What is JWT (JSON Web Token)?</strong></summary>

**JWT (JSON Web Token)** is a compact, URL-safe token that contains encoded information and can be verified and trusted because it is digitally signed.

### Key Features

- **Stateless**: Server doesn't need to store session data
- **Self-contained**: Token contains all necessary user information
- **Secure**: Digitally signed to prevent tampering
- **Compact**: Can be sent via URL, POST parameter, or HTTP header

### Why Use JWT?

- ✅ No need to maintain session storage on the server
- ✅ Scalable across multiple servers
- ✅ Can contain user information (claims)
- ✅ Works well with APIs and mobile apps
- ✅ Supports expiration time

### Common Use Cases

- User authentication
- API authorization
- Information exchange between parties
- Single Sign-On (SSO)

</details>

---

<details>
<summary><strong>JWT Structure</strong></summary>

A JWT token is divided into **3 parts** separated by dots (`.`):
```
xxxxx.yyyyy.zzzzz
```

### 1. Header

Contains the type of token (JWT) and the signing algorithm (HS256, RS256, etc.)
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

### 2. Payload

Contains the claims (data/information about the user)
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "iat": 1516239022,
  "exp": 1516242622
}
```

**Common Claims:**
- `_id`: User ID
- `iat` (issued at): Token creation timestamp
- `exp` (expiration): Token expiry timestamp
- Custom claims: Any data you want to include

### 3. Signature

Created by combining:
- Encoded header
- Encoded payload
- Secret key
- Algorithm specified in header
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### Example JWT Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Parts:**
- **Header**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`
- **Payload**: `eyJfaWQiOiI1MDdmMWY3N2JjZjg2Y2Q3OTk0MzkwMTEiLCJpYXQiOjE1MTYyMzkwMjJ9`
- **Signature**: `SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`

</details>

---

<details>
<summary><strong>Installation</strong></summary>

Install required packages:
```bash
npm install express cookie-parser jsonwebtoken bcrypt validator mongoose
```

### Package Purposes

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `cookie-parser` | Parse cookies from requests |
| `jsonwebtoken` | Create and verify JWT tokens |
| `bcrypt` | Hash and compare passwords |
| `validator` | Validate email and other inputs |
| `mongoose` | MongoDB object modeling |

</details>

---

<details>
<summary><strong>Login Flow with JWT</strong></summary>

### Authentication Flow Diagram
```
Client                          Server                        Database
  |                               |                               |
  |--1. POST /login------------->|                               |
  |   (email, password)           |                               |
  |                               |--2. Find user--------------->|
  |                               |<--3. User data---------------|
  |                               |                               |
  |                               |--4. Compare password          |
  |                               |   (bcrypt.compare)            |
  |                               |                               |
  |                               |--5. Generate JWT token        |
  |                               |   (jwt.sign)                  |
  |                               |                               |
  |<--6. Set cookie & response----|                               |
  |   (Set-Cookie: token=xxx)     |                               |
  |                               |                               |
```

### Step-by-Step Process

1. **User sends login credentials** (email, password)
2. **Server validates email format**
3. **Server finds user in database**
4. **Server compares password** using bcrypt
5. **Server generates JWT token** containing user ID
6. **Server puts JWT token in cookie**
7. **Cookie is sent back in response**
8. **Browser automatically stores cookie**
9. **Browser sends cookie with every subsequent request**

### Accessing Protected Routes
```
Client                          Server                        Database
  |                               |                               |
  |--1. GET /profile------------->|                               |
  |   Cookie: token=xxx           |                               |
  |                               |                               |
  |                               |--2. Extract token from cookie |
  |                               |                               |
  |                               |--3. Verify token              |
  |                               |   (jwt.verify)                |
  |                               |                               |
  |                               |--4. Get user ID from token    |
  |                               |                               |
  |                               |--5. Find user--------------->|
  |                               |<--6. User data---------------|
  |                               |                               |
  |<--7. Send user profile--------|                               |
  |                               |                               |
```

</details>

---

<details>
<summary><strong>Complete Implementation</strong></summary>

### Server Setup
```javascript
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const validator = require("validator");
const User = require("./models/user");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());  // IMPORTANT: Parse cookies from requests
```

### Login Route (Create JWT Token)
```javascript
app.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;
        
        // 1. Validate email format
        if (!validator.isEmail(emailId)) {
            throw new Error("Invalid Credentials!");
        }
        
        // 2. Find user in database
        const user = await User.findOne({ emailId: emailId });
        if (!user) {
            throw new Error("Invalid Credentials!");
        }
        
        // 3. Compare password with hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            throw new Error("Invalid Credentials!");
        }
        
        // 4. Create JWT token with user ID
        const token = await jwt.sign(
            { _id: user._id },           // Payload (user data)
            "VIKRAM@^*@#"                // Secret key
        );
        
        // 5. Set token in cookie
        res.cookie("token", token);
        
        // 6. Send success response
        res.status(200).send("Login Successful!");
        
    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }
});
```

### Profile Route (Verify JWT Token)
```javascript
app.get("/profile", async (req, res) => {
    try {
        // 1. Get token from cookies
        const { token } = req.cookies;
        
        if (!token) {
            throw new Error("User Not Registered!");
        }
        
        // 2. Verify token and decode payload
        const decodedToken = jwt.verify(token, "VIKRAM@^*@#");
        
        // 3. Extract user ID from decoded token
        const { _id } = decodedToken;
        
        // 4. Find user in database
        const user = await User.findById(_id);
        
        if (!user) {
            throw new Error("User not found!");
        }
        
        // 5. Send user profile (exclude password)
        res.status(200).json({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            emailId: user.emailId,
            age: user.age
        });
        
    } catch (err) {
        res.status(400).send("Error: " + err.message);
    }
});
```

### Logout Route
```javascript
app.post("/logout", (req, res) => {
    // Clear the token cookie
    res.cookie("token", null, {
        expires: new Date(Date.now())
    });
    res.send("Logout successful!");
});
```

### Complete Server with Authentication
```javascript
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const validator = require("validator");
const connectDB = require("./config/database");
const User = require("./models/user");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Secret key (should be in environment variable)
const JWT_SECRET = process.env.JWT_SECRET || "VIKRAM@^*@#";

// Signup route
app.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, emailId, password, age } = req.body;
        
        // Validate email
        if (!validator.isEmail(emailId)) {
            throw new Error("Invalid email!");
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const user = new User({
            firstName,
            lastName,
            emailId,
            password: hashedPassword,
            age
        });
        
        await user.save();
        res.status(201).send("User created successfully!");
        
    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }
});

// Login route
app.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;
        
        if (!validator.isEmail(emailId)) {
            throw new Error("Invalid Credentials!");
        }
        
        const user = await User.findOne({ emailId: emailId });
        if (!user) {
            throw new Error("Invalid Credentials!");
        }
        
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid Credentials!");
        }
        
        // Create JWT token with expiration
        const token = jwt.sign(
            { _id: user._id },
            JWT_SECRET,
            { expiresIn: "7d" }  // Token expires in 7 days
        );
        
        // Set cookie with options
        res.cookie("token", token, {
            httpOnly: true,      // Prevents client-side JS access
            secure: true,        // Only send over HTTPS (in production)
            maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days in milliseconds
        });
        
        res.status(200).send("Login Successful!");
        
    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }
});

// Profile route (protected)
app.get("/profile", async (req, res) => {
    try {
        const { token } = req.cookies;
        
        if (!token) {
            throw new Error("Please login to access this resource!");
        }
        
        const decodedToken = jwt.verify(token, JWT_SECRET);
        const { _id } = decodedToken;
        
        const user = await User.findById(_id).select("-password");
        
        if (!user) {
            throw new Error("User not found!");
        }
        
        res.status(200).json(user);
        
    } catch (err) {
        res.status(401).send("Error: " + err.message);
    }
});

// Logout route
app.post("/logout", (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now())
    });
    res.send("Logout successful!");
});

// Start server
connectDB()
    .then(() => {
        console.log("Database connected!");
        app.listen(8888, () => {
            console.log("Server running on port 8888");
        });
    })
    .catch(err => console.error("Database connection error:", err));
```

</details>

---

<details>
<summary><strong>JWT Methods Reference</strong></summary>

### jwt.sign() - Create Token

**Syntax:**
```javascript
jwt.sign(payload, secretOrPrivateKey, [options])
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `payload` | Object/String | Data to encode in token |
| `secretOrPrivateKey` | String | Secret key for signing |
| `options` | Object | Optional settings |

**Common Options:**
```javascript
const token = jwt.sign(
    { _id: user._id, email: user.email },  // Payload
    "SECRET_KEY",                           // Secret
    {
        expiresIn: "7d",        // Expires in 7 days
        issuer: "myapp",        // Who issued the token
        audience: "users"       // Who can use the token
    }
);
```

**Expiration Time Formats:**
```javascript
expiresIn: "2h"      // 2 hours
expiresIn: "7d"      // 7 days
expiresIn: "10s"     // 10 seconds
expiresIn: "1y"      // 1 year
expiresIn: 3600      // 3600 seconds (1 hour)
```

### jwt.verify() - Verify Token

**Syntax:**
```javascript
jwt.verify(token, secretOrPublicKey, [options])
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | String | JWT token to verify |
| `secretOrPublicKey` | String | Secret key used for signing |
| `options` | Object | Optional settings |

**Usage:**
```javascript
try {
    const decoded = jwt.verify(token, "SECRET_KEY");
    console.log(decoded);
    // { _id: '123', email: 'user@example.com', iat: 1234567890, exp: 1234571490 }
} catch (error) {
    console.log("Invalid token:", error.message);
}
```

**Common Errors:**
```javascript
// TokenExpiredError
jwt.verify(expiredToken, "SECRET_KEY");
// Error: jwt expired

// JsonWebTokenError
jwt.verify(invalidToken, "SECRET_KEY");
// Error: invalid token

// JsonWebTokenError (wrong secret)
jwt.verify(token, "WRONG_SECRET");
// Error: invalid signature
```

### jwt.decode() - Decode Without Verification

**Syntax:**
```javascript
jwt.decode(token, [options])
```

**Warning**: This does NOT verify the signature. Only use for debugging.
```javascript
const decoded = jwt.decode(token);
console.log(decoded);  // Shows payload without verification
```

</details>

---

<details>
<summary><strong>Best Practices</strong></summary>

### 1. Use Environment Variables for Secret Key
```javascript
// ❌ Bad - hardcoded secret
const token = jwt.sign({ _id: user._id }, "VIKRAM@^*@#");

// ✅ Good - use environment variable
require('dotenv').config();
const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
```

**.env file:**
```env
JWT_SECRET=your-super-secret-key-min-32-characters-long
```

### 2. Set Token Expiration
```javascript
// ❌ Bad - no expiration
const token = jwt.sign({ _id: user._id }, secret);

// ✅ Good - with expiration
const token = jwt.sign(
    { _id: user._id },
    secret,
    { expiresIn: "7d" }
);
```

### 3. Use httpOnly Cookies
```javascript
// ❌ Bad - accessible via JavaScript
res.cookie("token", token);

// ✅ Good - httpOnly prevents XSS attacks
res.cookie("token", token, {
    httpOnly: true,      // Cannot be accessed by client-side JS
    secure: true,        // Only send over HTTPS
    sameSite: "strict",  // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
});
```

### 4. Don't Store Sensitive Data in JWT
```javascript
// ❌ Bad - storing sensitive data
const token = jwt.sign({
    _id: user._id,
    password: user.password,      // Never!
    creditCard: user.cardNumber   // Never!
}, secret);

// ✅ Good - only store necessary identifiers
const token = jwt.sign({
    _id: user._id,
    email: user.email
}, secret);
```

### 5. Create Authentication Middleware
```javascript
// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
    try {
        const { token } = req.cookies;
        
        if (!token) {
            throw new Error("Please authenticate!");
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id);
        
        if (!user) {
            throw new Error("User not found!");
        }
        
        req.user = user;  // Attach user to request object
        next();
        
    } catch (error) {
        res.status(401).send("Error: " + error.message);
    }
};

module.exports = auth;
```

**Usage:**
```javascript
const auth = require("./middleware/auth");

// Protected route
app.get("/profile", auth, async (req, res) => {
    res.json(req.user);  // User already attached by middleware
});

app.get("/dashboard", auth, async (req, res) => {
    res.send(`Welcome ${req.user.firstName}!`);
});
```

### 6. Handle Token Expiration Gracefully
```javascript
app.get("/profile", async (req, res) => {
    try {
        const { token } = req.cookies;
        
        if (!token) {
            return res.status(401).send("Please login!");
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded._id);
        
        res.json(user);
        
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            res.status(401).send("Session expired. Please login again!");
        } else if (error.name === "JsonWebTokenError") {
            res.status(401).send("Invalid token. Please login again!");
        } else {
            res.status(500).send("Server error!");
        }
    }
});
```

### 7. Use Secure Secret Keys
```javascript
// ❌ Bad - weak secret
const secret = "123";
const secret = "password";

// ✅ Good - strong, random secret
const secret = "aB3$kL9@mP2#qR7*sT4&vW8!xY1^zA5%";

// Generate strong secret (Node.js)
require('crypto').randomBytes(32).toString('hex');
```

</details>

---

<details>
<summary><strong>Common Mistakes</strong></summary>

### Mistake 1: Not Using cookie-parser
```javascript
// ❌ Wrong - req.cookies will be undefined
app.get("/profile", (req, res) => {
    const { token } = req.cookies;  // undefined!
});

// ✅ Correct - use cookie-parser middleware
app.use(cookieParser());
app.get("/profile", (req, res) => {
    const { token } = req.cookies;  // Works!
});
```

### Mistake 2: Wrong Order - jwt.sign is Synchronous
```javascript
// ❌ Wrong - no need for await
const token = await jwt.sign({ _id: user._id }, secret);

// ✅ Correct - jwt.sign is synchronous
const token = jwt.sign({ _id: user._id }, secret);

// Note: jwt.verify is also synchronous
const decoded = jwt.verify(token, secret);  // No await needed
```

### Mistake 3: Using User.find() Instead of User.findById()
```javascript
// ❌ Wrong - returns array even for single result
const user = await User.find({ _id: _id });
res.send(user);  // Sends array: [{ user data }]

// ✅ Correct - returns single document
const user = await User.findById(_id);
res.send(user);  // Sends object: { user data }
```

### Mistake 4: Not Handling Verification Errors
```javascript
// ❌ Wrong - will crash if token is invalid
const decoded = jwt.verify(token, secret);

// ✅ Correct - wrap in try-catch
try {
    const decoded = jwt.verify(token, secret);
} catch (error) {
    res.status(401).send("Invalid token!");
}
```

### Mistake 5: Storing Token in Local Storage (Client-Side)
```javascript
// ❌ Bad - vulnerable to XSS attacks
// Client-side code
localStorage.setItem('token', token);

// ✅ Good - use httpOnly cookies
// Server-side code
res.cookie("token", token, {
    httpOnly: true,  // JavaScript cannot access
    secure: true
});
```

### Mistake 6: Not Setting Cookie Options in Production
```javascript
// ❌ Bad - insecure cookie
res.cookie("token", token);

// ✅ Good - secure cookie settings
res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
});
```

</details>

---

<details>
<summary><strong>Security Considerations</strong></summary>

### 1. Secret Key Management

- ✅ Use environment variables for secrets
- ✅ Use long, random secrets (min 32 characters)
- ✅ Never commit secrets to version control
- ✅ Rotate secrets periodically
- ❌ Never hardcode secrets in code

### 2. Token Storage

**Client-Side Options:**

| Storage | Security | Recommendation |
|---------|----------|----------------|
| LocalStorage | ❌ Vulnerable to XSS | Never use for tokens |
| SessionStorage | ❌ Vulnerable to XSS | Never use for tokens |
| Cookies (httpOnly) | ✅ Protected from XSS | **Recommended** |
| Memory | ✅ Secure but lost on refresh | For sensitive operations |

### 3. Cookie Security Options
```javascript
res.cookie("token", token, {
    httpOnly: true,      // ✅ Prevents XSS attacks
    secure: true,        // ✅ Only HTTPS in production
    sameSite: "strict",  // ✅ Prevents CSRF attacks
    maxAge: 604800000,   // ✅ Set expiration (7 days)
    domain: ".example.com", // Optional: specify domain
    path: "/"            // Optional: cookie path
});
```

### 4. Token Expiration
```javascript
// Short-lived access tokens
const accessToken = jwt.sign(
    { _id: user._id },
    secret,
    { expiresIn: "15m" }  // 15 minutes
);

// Long-lived refresh tokens
const refreshToken = jwt.sign(
    { _id: user._id },
    refreshSecret,
    { expiresIn: "7d" }  // 7 days
);
```

### 5. HTTPS in Production
```javascript
// Development
const cookieOptions = {
    httpOnly: true,
    secure: false  // Allow HTTP in development
};

// Production
const cookieOptions = {
    httpOnly: true,
    secure: true,  // Require HTTPS
    sameSite: "strict"
};

// Dynamic based on environment
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict"
};
```

### 6. Sensitive Data Protection

**Never include in JWT:**
- ❌ Passwords (hashed or plain)
- ❌ Credit card numbers
- ❌ Social security numbers
- ❌ Private API keys
- ❌ Personal health information

**Safe to include:**
- ✅ User ID
- ✅ Email address
- ✅ Username
- ✅ User role/permissions
- ✅ Non-sensitive metadata

### 7. Rate Limiting
```javascript
const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,  // 5 requests per window
    message: "Too many login attempts. Try again later."
});

app.post("/login", loginLimiter, async (req, res) => {
    // Login logic
});
```

### 8. Token Blacklisting (for Logout)
```javascript
// Simple in-memory blacklist (use Redis in production)
const tokenBlacklist = new Set();

// Logout route
app.post("/logout", async (req, res) => {
    const { token } = req.cookies;
    tokenBlacklist.add(token);
    res.cookie("token", null, { expires: new Date(Date.now()) });
    res.send("Logged out!");
});

// Auth middleware
const auth = async (req, res, next) => {
    const { token } = req.cookies;
    
    if (tokenBlacklist.has(token)) {
        return res.status(401).send("Token has been revoked!");
    }
    
    // Continue verification...
};
```

</details>

---

## Quick Reference

### Cookie Parser Setup
```javascript
const cookieParser = require("cookie-parser");
app.use(cookieParser());
```

### Create JWT Token (Login)
```javascript
const token = jwt.sign({ _id: user._id }, secret, { expiresIn: "7d" });
res.cookie("token", token, { httpOnly: true });
```

### Verify JWT Token (Protected Route)
```javascript
const { token } = req.cookies;
const decoded = jwt.verify(token, secret);
const user = await User.findById(decoded._id);
```

### Clear Cookie (Logout)
```javascript
res.cookie("token", null, { expires: new Date(Date.now()) });
```

</details>

Mongoose schema methods 

Every user has a diff way of signing the token, so you can offload such things into user schema methods

userSchema.methods.getJWT = async function() {
    const user = this; //it will represent that particular instance
    //"this keyword wont work in arrow function"
    const token = await jwt.sign({ _id: user._id }, "VIKRAM@^*@#", {expiresIn: '1d'})
    return token;
}

while writing these things make sure not to write them in arrow functions, as they break things up

using schema method inside we can write 

```
        if (isPasswordValid) {
            const token = await user.getJWT();
            res.cookie("token", token)
            //Add the token to cookie and send the response back to user
            res.status(200).send("Login Successful!")
        } 
```
inside 
```
app.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;
        if (!validator.isEmail(emailId)) {
            throw new Error("Invalid Credentials!")
        }
        const user = await User.findOne({ emailId: emailId });
        if (!user) {
            throw new Error("User not present")
        }
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (isPasswordValid) {
            const token = await user.getJWT();
            res.cookie("token", token)
            //Add the token to cookie and send the response back to user
            res.status(200).send("Login Successful!")
        } else {
            throw new Error("Invalid Credentials!")
        }
    } catch (error) {
        res.status(400).send("ERROR: " + error.message)
    }
})
```

-> To validate the password
```
userSchema.methods.validatePassword = async function (passwordInputByUser) {
    const user = this;
    const passwordHash = user.password
    const isPasswordValid = bcrypt.compare(passwordInputByUser, passwordHash)
    return isPasswordValid;
} 
```
```
app.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;
        if (!validator.isEmail(emailId)) {
            throw new Error("Invalid Credentials!")
        }
        const user = await User.findOne({ emailId: emailId });
        if (!user) {
            throw new Error("User not present")
        }
        const isPasswordValid = await user.validatePassword(password)
        if (isPasswordValid) {
            const token = await user.getJWT();
            res.cookie("token", token)
            //Add the token to cookie and send the response back to user
            res.status(200).send("Login Successful!")
        } else {
            throw new Error("Invalid Credentials!")
        }
    } catch (error) {
        res.status(400).send("ERROR: " + error.message)
    }
})
```


<details>
<summary><strong>🔧 Mongoose Schema Methods (Instance Methods)</strong></summary>

<details>
<summary><strong>Table of Contents</strong></summary>

- [What are Schema Methods?](#what-are-schema-methods)
- [Why Use Schema Methods?](#why-use-schema-methods)
- [Creating Schema Methods](#creating-schema-methods)
- [Common Use Cases](#common-use-cases)
- [Complete Implementation](#complete-implementation)
- [Instance Methods vs Static Methods](#instance-methods-vs-static-methods)
- [Best Practices](#best-practices)
- [Common Mistakes](#common-mistakes)

</details>

---

<details>
<summary><strong>What are Schema Methods?</strong></summary>

**Schema methods** (also called **instance methods**) are custom functions that you can add to your Mongoose schema. These methods are available on each document instance.

### Key Characteristics

- Defined using `schema.methods.methodName`
- Available on document instances (individual users, posts, etc.)
- Can access document data using `this` keyword
- Cannot use arrow functions (they break `this` binding)
- Help organize business logic related to documents

### Basic Example
```javascript
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String
});

// Define a schema method
userSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

const User = mongoose.model("User", userSchema);

// Usage
const user = await User.findById(userId);
console.log(user.getFullName());  // "John Doe"
```

</details>

---

<details>
<summary><strong>Why Use Schema Methods?</strong></summary>

### Benefits

1. **Code Reusability**: Write logic once, use it everywhere
2. **Encapsulation**: Keep document-related logic with the schema
3. **Cleaner Routes**: Remove repetitive code from route handlers
4. **Maintainability**: Changes in one place affect all usages
5. **Testing**: Easier to test isolated methods
6. **Readability**: Self-documenting code with meaningful method names

### Without Schema Methods ❌
```javascript
// Repeated code in multiple routes
app.post("/login", async (req, res) => {
    const user = await User.findOne({ emailId });
    const token = jwt.sign({ _id: user._id }, "SECRET", { expiresIn: '1d' });
    // ... more code
});

app.post("/refresh", async (req, res) => {
    const user = await User.findById(userId);
    const token = jwt.sign({ _id: user._id }, "SECRET", { expiresIn: '1d' });
    // ... same code repeated
});
```

### With Schema Methods ✅
```javascript
// Define once in schema
userSchema.methods.getJWT = function() {
    return jwt.sign({ _id: this._id }, "SECRET", { expiresIn: '1d' });
};

// Use everywhere
app.post("/login", async (req, res) => {
    const user = await User.findOne({ emailId });
    const token = user.getJWT();  // Clean and reusable
});

app.post("/refresh", async (req, res) => {
    const user = await User.findById(userId);
    const token = user.getJWT();  // Same method, no duplication
});
```

</details>

---

<details>
<summary><strong>Creating Schema Methods</strong></summary>

### Basic Syntax
```javascript
schemaName.methods.methodName = function() {
    // 'this' refers to the document instance
    // DO NOT use arrow functions!
};
```

### Important Rules

1. **Always use regular function syntax** (not arrow functions)
2. **Use `this` to access document data**
3. **Can be synchronous or asynchronous**
4. **Defined before creating the model**

### Example: JWT Token Generation Method
```javascript
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    emailId: String,
    password: String
});

// Schema method to generate JWT token
userSchema.methods.getJWT = function() {
    const user = this;  // 'this' represents the document instance
    
    const token = jwt.sign(
        { _id: user._id },           // Payload
        "VIKRAM@^*@#",               // Secret (use env variable in production)
        { expiresIn: '1d' }          // Options
    );
    
    return token;
};

// Create model AFTER defining methods
const User = mongoose.model("User", userSchema);

module.exports = User;
```

### Why Arrow Functions Don't Work
```javascript
// ❌ WRONG - Arrow function breaks 'this' binding
userSchema.methods.getJWT = () => {
    const user = this;  // 'this' is undefined or wrong context!
    return jwt.sign({ _id: user._id }, secret);
};

// ✅ CORRECT - Regular function preserves 'this'
userSchema.methods.getJWT = function() {
    const user = this;  // 'this' correctly refers to the document
    return jwt.sign({ _id: user._id }, secret);
};
```

</details>

---

<details>
<summary><strong>Common Use Cases</strong></summary>

### 1. Generate JWT Token
```javascript
userSchema.methods.getJWT = function() {
    const user = this;
    
    const token = jwt.sign(
        { _id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
    
    return token;
};

// Usage
const user = await User.findOne({ emailId });
const token = user.getJWT();
res.cookie("token", token);
```

### 2. Validate Password
```javascript
userSchema.methods.validatePassword = async function(passwordInputByUser) {
    const user = this;
    const passwordHash = user.password;
    
    const isPasswordValid = await bcrypt.compare(
        passwordInputByUser,
        passwordHash
    );
    
    return isPasswordValid;
};

// Usage
const user = await User.findOne({ emailId });
const isValid = await user.validatePassword(password);

if (isValid) {
    // Login successful
}
```

### 3. Get Full Name
```javascript
userSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

// Usage
const user = await User.findById(userId);
console.log(user.getFullName());  // "John Doe"
```

### 4. Get Profile Data (Exclude Sensitive Fields)
```javascript
userSchema.methods.getPublicProfile = function() {
    const user = this;
    
    return {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
        age: user.age
        // Password is excluded
    };
};

// Usage
const user = await User.findById(userId);
res.json(user.getPublicProfile());
```

### 5. Check if User is Admin
```javascript
userSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

// Usage
const user = await User.findById(userId);
if (user.isAdmin()) {
    // Allow admin actions
}
```

### 6. Generate Password Reset Token
```javascript
userSchema.methods.generatePasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken;
};

// Usage
const user = await User.findOne({ emailId });
const resetToken = user.generatePasswordResetToken();
await user.save();
```

### 7. Format User Data for Response
```javascript
userSchema.methods.toJSON = function() {
    const user = this;
    const userObject = user.toObject();
    
    // Remove sensitive fields
    delete userObject.password;
    delete userObject.__v;
    
    return userObject;
};

// Usage
const user = await User.findById(userId);
res.json(user);  // Automatically uses toJSON()
```

</details>

---

<details>
<summary><strong>Complete Implementation</strong></summary>

### User Model with Schema Methods
```javascript
// models/user.js
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const validator = require("validator");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        validate: {
            validator: validator.isEmail,
            message: "Invalid email format"
        }
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    age: {
        type: Number,
        min: 18
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, {
    timestamps: true
});

// Method 1: Generate JWT Token
userSchema.methods.getJWT = function() {
    const user = this;
    
    const token = jwt.sign(
        { _id: user._id },
        process.env.JWT_SECRET || "VIKRAM@^*@#",
        { expiresIn: '1d' }
    );
    
    return token;
};

// Method 2: Validate Password
userSchema.methods.validatePassword = async function(passwordInputByUser) {
    const user = this;
    const passwordHash = user.password;
    
    const isPasswordValid = await bcrypt.compare(
        passwordInputByUser,
        passwordHash
    );
    
    return isPasswordValid;
};

// Method 3: Get Full Name
userSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

// Method 4: Get Public Profile
userSchema.methods.getPublicProfile = function() {
    const user = this;
    
    return {
        id: user._id,
        fullName: user.getFullName(),
        emailId: user.emailId,
        age: user.age,
        role: user.role,
        createdAt: user.createdAt
    };
};

// Method 5: Check if Admin
userSchema.methods.isAdmin = function() {
    return this.role === 'admin';
};

// Pre-save middleware to hash password
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return next();
    }
    
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.model("User", userSchema);

module.exports = User;
```

### Login Route Using Schema Methods
```javascript
// routes/auth.js
const express = require("express");
const validator = require("validator");
const User = require("../models/user");

const router = express.Router();

router.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;
        
        // Validate email format
        if (!validator.isEmail(emailId)) {
            throw new Error("Invalid Credentials!");
        }
        
        // Find user by email
        const user = await User.findOne({ emailId: emailId });
        
        if (!user) {
            throw new Error("Invalid Credentials!");
        }
        
        // Validate password using schema method
        const isPasswordValid = await user.validatePassword(password);
        
        if (!isPasswordValid) {
            throw new Error("Invalid Credentials!");
        }
        
        // Generate JWT token using schema method
        const token = user.getJWT();
        
        // Set token in cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 24 * 60 * 60 * 1000  // 1 day
        });
        
        // Send success response
        res.status(200).json({
            message: "Login Successful!",
            user: user.getPublicProfile()
        });
        
    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }
});

module.exports = router;
```

### Profile Route Using Schema Methods
```javascript
router.get("/profile", auth, async (req, res) => {
    try {
        // req.user is set by auth middleware
        const user = req.user;
        
        // Use schema method to get public profile
        res.json({
            profile: user.getPublicProfile(),
            fullName: user.getFullName(),
            isAdmin: user.isAdmin()
        });
        
    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }
});
```

### Complete Server Example
```javascript
// app.js
const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");
const User = require("./models/user");
const validator = require("validator");

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// Signup Route
app.post("/signup", async (req, res) => {
    try {
        const { firstName, lastName, emailId, password, age } = req.body;
        
        // Create user (password will be hashed by pre-save hook)
        const user = new User({
            firstName,
            lastName,
            emailId,
            password,
            age
        });
        
        await user.save();
        
        // Generate token using schema method
        const token = user.getJWT();
        
        res.cookie("token", token, { httpOnly: true });
        
        res.status(201).json({
            message: "User created successfully!",
            user: user.getPublicProfile()
        });
        
    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }
});

// Login Route
app.post("/login", async (req, res) => {
    try {
        const { emailId, password } = req.body;
        
        if (!validator.isEmail(emailId)) {
            throw new Error("Invalid Credentials!");
        }
        
        const user = await User.findOne({ emailId: emailId });
        
        if (!user) {
            throw new Error("Invalid Credentials!");
        }
        
        // Use schema method to validate password
        const isPasswordValid = await user.validatePassword(password);
        
        if (!isPasswordValid) {
            throw new Error("Invalid Credentials!");
        }
        
        // Use schema method to generate token
        const token = user.getJWT();
        
        res.cookie("token", token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });
        
        res.status(200).json({
            message: "Login Successful!",
            user: user.getPublicProfile()
        });
        
    } catch (error) {
        res.status(400).send("ERROR: " + error.message);
    }
});

// Profile Route
app.get("/profile", async (req, res) => {
    try {
        const { token } = req.cookies;
        
        if (!token) {
            throw new Error("Please login!");
        }
        
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "VIKRAM@^*@#");
        
        const user = await User.findById(decoded._id);
        
        if (!user) {
            throw new Error("User not found!");
        }
        
        // Use schema methods
        res.json({
            fullName: user.getFullName(),
            profile: user.getPublicProfile(),
            isAdmin: user.isAdmin()
        });
        
    } catch (error) {
        res.status(401).send("ERROR: " + error.message);
    }
});

// Start server
connectDB()
    .then(() => {
        console.log("Database connected!");
        app.listen(8888, () => {
            console.log("Server running on port 8888");
        });
    })
    .catch(err => console.error("Database error:", err));
```

</details>

---

<details>
<summary><strong>Instance Methods vs Static Methods</strong></summary>

### Instance Methods (`schema.methods`)

Called on **document instances** (individual users, posts, etc.)
```javascript
// Define instance method
userSchema.methods.getJWT = function() {
    return jwt.sign({ _id: this._id }, secret);
};

// Usage - called on a specific user document
const user = await User.findById(userId);
const token = user.getJWT();  // Called on instance
```

### Static Methods (`schema.statics`)

Called on the **Model itself** (User, Post, etc.)
```javascript
// Define static method
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ emailId: email });
};

// Usage - called on the Model
const user = await User.findByEmail("test@example.com");  // Called on Model
```

### Comparison Table

| Feature | Instance Methods | Static Methods |
|---------|-----------------|----------------|
| Definition | `schema.methods.name` | `schema.statics.name` |
| Called On | Document instance | Model class |
| `this` refers to | Document | Model |
| Use Case | Document-specific logic | Model-level queries |
| Example | `user.getJWT()` | `User.findByEmail()` |

### When to Use Each

**Instance Methods** - Use when:
- Operating on a specific document
- Need access to document data
- Examples: generate token, validate password, format data

**Static Methods** - Use when:
- Creating custom queries
- Model-level operations
- Examples: find by custom criteria, aggregate data

### Combined Example
```javascript
// Instance method - operates on single user
userSchema.methods.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Static method - finds user by email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ emailId: email });
};

// Usage
const user = await User.findByEmail("test@example.com");  // Static
const isValid = await user.validatePassword("password123");  // Instance
```

</details>

---

<details>
<summary><strong>Best Practices</strong></summary>

### 1. Use Regular Functions (Not Arrow Functions)
```javascript
// ❌ Wrong - Arrow function breaks 'this'
userSchema.methods.getJWT = () => {
    return jwt.sign({ _id: this._id }, secret);  // 'this' is undefined!
};

// ✅ Correct - Regular function
userSchema.methods.getJWT = function() {
    return jwt.sign({ _id: this._id }, secret);  // 'this' works!
};
```

### 2. Use Descriptive Method Names
```javascript
// ❌ Bad - unclear names
userSchema.methods.doThing = function() { ... };
userSchema.methods.check = function() { ... };

// ✅ Good - clear, descriptive names
userSchema.methods.generateJWT = function() { ... };
userSchema.methods.validatePassword = function() { ... };
userSchema.methods.getPublicProfile = function() { ... };
```

### 3. Store `this` in a Variable for Clarity
```javascript
userSchema.methods.getJWT = function() {
    const user = this;  // Clear reference to document
    
    return jwt.sign(
        { _id: user._id, email: user.emailId },
        secret
    );
};
```

### 4. Handle Async Operations Properly
```javascript
// ❌ Wrong - missing await
userSchema.methods.validatePassword = function(password) {
    return bcrypt.compare(password, this.password);  // Returns Promise
};

// ✅ Correct - async/await
userSchema.methods.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};
```

### 5. Don't Expose Sensitive Data
```javascript
// ❌ Bad - exposes password
userSchema.methods.getData = function() {
    return this;
};

// ✅ Good - excludes sensitive fields
userSchema.methods.getPublicProfile = function() {
    return {
        id: this._id,
        firstName: this.firstName,
        emailId: this.emailId
        // password excluded
    };
};
```

### 6. Keep Methods Focused and Small
```javascript
// ❌ Bad - doing too much
userSchema.methods.loginUser = async function(password) {
    const isValid = await bcrypt.compare(password, this.password);
    const token = jwt.sign({ _id: this._id }, secret);
    // ... more logic
};

// ✅ Good - separate concerns
userSchema.methods.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateToken = function() {
    return jwt.sign({ _id: this._id }, secret);
};
```

### 7. Use Environment Variables for Secrets
```javascript
// ❌ Bad - hardcoded secret
userSchema.methods.getJWT = function() {
    return jwt.sign({ _id: this._id }, "HARDCODED_SECRET");
};

// ✅ Good - environment variable
userSchema.methods.getJWT = function() {
    return jwt.sign(
        { _id: this._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};
```

### 8. Add Error Handling
```javascript
userSchema.methods.getJWT = function() {
    try {
        const token = jwt.sign(
            { _id: this._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        return token;
    } catch (error) {
        throw new Error("Failed to generate token: " + error.message);
    }
};
```

</details>

---

<details>
<summary><strong>Common Mistakes</strong></summary>

### Mistake 1: Using Arrow Functions
```javascript
// ❌ WRONG - 'this' doesn't work in arrow functions
userSchema.methods.getJWT = () => {
    return jwt.sign({ _id: this._id }, secret);  // this is undefined!
};

// ✅ CORRECT
userSchema.methods.getJWT = function() {
    return jwt.sign({ _id: this._id }, secret);
};
```

### Mistake 2: Not Using `await` with Async Methods
```javascript
// ❌ WRONG - not awaiting async method
const isValid = user.validatePassword(password);  // Returns Promise
if (isValid) { ... }  // Always truthy (it's a Promise object!)

// ✅ CORRECT
const isValid = await user.validatePassword(password);
if (isValid) { ... }  // Now it's the actual boolean value
```

### Mistake 3: Defining Methods After Model Creation
```javascript
// ❌ WRONG - methods defined after model
const User = mongoose.model("User", userSchema);

userSchema.methods.getJWT = function() { ... };  // Too late!

// ✅ CORRECT - methods defined before model
userSchema.methods.getJWT = function() { ... };

const User = mongoose.model("User", userSchema);
```

### Mistake 4: Calling Instance Method on Model
```javascript
// ❌ WRONG - calling instance method on Model
const token = User.getJWT();  // Error! Not a function

// ✅ CORRECT - call on document instance
const user = await User.findById(userId);
const token = user.getJWT();
```

### Mistake 5: Modifying `this` Incorrectly
```javascript
// ❌ WRONG - assigning new object to 'this'
userSchema.methods.update = function(data) {
    this = { ...this, ...data };  // Can't reassign 'this'
};

// ✅ CORRECT - modify properties of 'this'
userSchema.methods.update = function(data) {
    Object.assign(this, data);
    return this.save();
};
```

### Mistake 6: Not Returning Values
```javascript
// ❌ WRONG - method doesn't return anything
userSchema.methods.getJWT = function() {
    jwt.sign({ _id: this._id }, secret);  // Missing return!
};

const token = user.getJWT();  // undefined

// ✅ CORRECT
userSchema.methods.getJWT = function() {
    return jwt.sign({ _id: this._id }, secret);
};
```

</details>

---

## Quick Reference

### Define Schema Method
```javascript
userSchema.methods.methodName = function() {
    const user = this;  // Document instance
    // Your logic here
    return result;
};
```

### Generate JWT Token
```javascript
userSchema.methods.getJWT = function() {
    return jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
```

### Validate Password
```javascript
userSchema.methods.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};
```

### Usage in Routes
```javascript
const user = await User.findOne({ emailId });
const token = user.getJWT();
const isValid = await user.validatePassword(password);
```

</details>


Express Router

List APIs and Group them based on the type of APIs


<details>
<summary><strong>🛣️ Express Router - Organizing Routes</strong></summary>

<details>
<summary><strong>Table of Contents</strong></summary>

- [What is Express Router?](#what-is-express-router)
- [Why Use Express Router?](#why-use-express-router)
- [Basic Router Setup](#basic-router-setup)
- [Grouping Routes by Feature](#grouping-routes-by-feature)
- [Complete Implementation](#complete-implementation)
- [Router-Level Middleware](#router-level-middleware)
- [Route Parameters and Query Strings](#route-parameters-and-query-strings)
- [Best Practices](#best-practices)
- [Common Mistakes](#common-mistakes)

</details>

---

<details>
<summary><strong>What is Express Router?</strong></summary>

**Express Router** is a mini Express application that allows you to organize your routes into modular, mountable route handlers.

### Key Features

- **Modular routing**: Split routes into separate files
- **Middleware support**: Apply middleware to specific route groups
- **Mountable**: Can be mounted at different paths
- **Organized**: Group related routes together
- **Maintainable**: Easier to manage large applications

### Without Router (Single File) ❌
```javascript
// app.js - Everything in one file
const express = require("express");
const app = express();

// Auth routes
app.post("/signup", (req, res) => { ... });
app.post("/login", (req, res) => { ... });
app.post("/logout", (req, res) => { ... });

// User routes
app.get("/user/profile", (req, res) => { ... });
app.patch("/user/profile", (req, res) => { ... });
app.delete("/user/account", (req, res) => { ... });

// Admin routes
app.get("/admin/users", (req, res) => { ... });
app.delete("/admin/user/:id", (req, res) => { ... });
app.get("/admin/stats", (req, res) => { ... });

// Product routes
app.get("/products", (req, res) => { ... });
app.post("/products", (req, res) => { ... });
app.get("/products/:id", (req, res) => { ... });

// ... 100+ more routes
// File becomes huge and unmanageable!
```

### With Router (Organized) ✅
```javascript
// app.js - Clean and organized
const express = require("express");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const productRoutes = require("./routes/product");

const app = express();

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/products", productRoutes);

// Much cleaner!
```

</details>

---

<details>
<summary><strong>Why Use Express Router?</strong></summary>

### Benefits

1. **Code Organization**
   - Separate routes by feature/resource
   - Easier to find and modify routes
   - Clear project structure

2. **Maintainability**
   - Changes don't affect entire app
   - Easier debugging
   - Team members can work on different route files

3. **Reusability**
   - Same router can be mounted at different paths
   - Share routers across projects

4. **Middleware Management**
   - Apply middleware to specific route groups
   - Authentication only for protected routes

5. **Scalability**
   - Add new features without cluttering main file
   - Handle hundreds of routes efficiently

### Problem Without Router
```javascript
// app.js - 500+ lines
app.get("/auth/login", ...);
app.post("/auth/signup", ...);
app.get("/user/profile", ...);
app.patch("/user/settings", ...);
app.get("/admin/dashboard", ...);
app.delete("/admin/user/:id", ...);
app.get("/products/list", ...);
app.post("/products/create", ...);
// ... 100+ more routes
// Very hard to maintain!
```

### Solution With Router
```javascript
// app.js - Clean
app.use("/auth", authRouter);
app.use("/user", userRouter);
app.use("/admin", adminRouter);
app.use("/products", productRouter);

// Each router in its own file
// Easy to maintain and scale!
```

</details>

---

<details>
<summary><strong>Basic Router Setup</strong></summary>

### Step 1: Create a Router File
```javascript
// routes/auth.js
const express = require("express");
const router = express.Router();

// Define routes
router.post("/signup", (req, res) => {
    res.send("Signup route");
});

router.post("/login", (req, res) => {
    res.send("Login route");
});

router.post("/logout", (req, res) => {
    res.send("Logout route");
});

// Export router
module.exports = router;
```

### Step 2: Import and Use in Main App
```javascript
// app.js
const express = require("express");
const authRouter = require("./routes/auth");

const app = express();

// Mount the router at /auth path
app.use("/auth", authRouter);

app.listen(3000);
```

### How It Works
```
Client Request: POST /auth/signup
                     ↓
app.use("/auth", authRouter)  → Matches /auth prefix
                     ↓
router.post("/signup", ...)   → Matches /signup path
                     ↓
Final Route: /auth/signup
```

### URL Structure

| Router Mount | Route Path | Final URL |
|-------------|------------|-----------|
| `/auth` | `/signup` | `/auth/signup` |
| `/auth` | `/login` | `/auth/login` |
| `/user` | `/profile` | `/user/profile` |
| `/admin` | `/users` | `/admin/users` |
| `/products` | `/:id` | `/products/:id` |

</details>

---

<details>
<summary><strong>Grouping Routes by Feature</strong></summary>

### Common Grouping Strategies

1. **By Resource** (User, Product, Order)
2. **By Feature** (Auth, Profile, Admin)
3. **By Access Level** (Public, Protected, Admin)
4. **By Version** (v1, v2)

### Example 1: Authentication Routes
```javascript
// routes/auth.js
const express = require("express");
const router = express.Router();

// POST /auth/signup
router.post("/signup", signupController);

// POST /auth/login
router.post("/login", loginController);

// POST /auth/logout
router.post("/logout", logoutController);

// POST /auth/forgot-password
router.post("/forgot-password", forgotPasswordController);

// POST /auth/reset-password
router.post("/reset-password", resetPasswordController);

module.exports = router;
```

### Example 2: User Routes
```javascript
// routes/user.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// All routes require authentication
router.use(auth);

// GET /user/profile
router.get("/profile", getProfileController);

// PATCH /user/profile
router.patch("/profile", updateProfileController);

// DELETE /user/account
router.delete("/account", deleteAccountController);

// GET /user/settings
router.get("/settings", getSettingsController);

// PATCH /user/settings
router.patch("/settings", updateSettingsController);

module.exports = router;
```

### Example 3: Admin Routes
```javascript
// routes/admin.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");

// All routes require authentication and admin role
router.use(auth);
router.use(isAdmin);

// GET /admin/users
router.get("/users", getAllUsersController);

// GET /admin/users/:id
router.get("/users/:id", getUserByIdController);

// DELETE /admin/users/:id
router.delete("/users/:id", deleteUserController);

// GET /admin/stats
router.get("/stats", getStatsController);

// PATCH /admin/users/:id/role
router.patch("/users/:id/role", updateUserRoleController);

module.exports = router;
```

### Example 4: Product Routes
```javascript
// routes/product.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Public routes
// GET /products
router.get("/", getAllProductsController);

// GET /products/:id
router.get("/:id", getProductByIdController);

// Protected routes (require authentication)
// POST /products
router.post("/", auth, createProductController);

// PATCH /products/:id
router.patch("/:id", auth, updateProductController);

// DELETE /products/:id
router.delete("/:id", auth, deleteProductController);

module.exports = router;
```

### List of Common Route Groups

#### Authentication Routes (`/auth`)
- POST `/signup` - Create new account
- POST `/login` - Login user
- POST `/logout` - Logout user
- POST `/refresh` - Refresh token
- POST `/forgot-password` - Request password reset
- POST `/reset-password` - Reset password
- POST `/verify-email` - Verify email address

#### User Routes (`/user`)
- GET `/profile` - Get user profile
- PATCH `/profile` - Update profile
- DELETE `/account` - Delete account
- GET `/settings` - Get user settings
- PATCH `/settings` - Update settings
- PATCH `/password` - Change password
- GET `/notifications` - Get notifications

#### Admin Routes (`/admin`)
- GET `/users` - List all users
- GET `/users/:id` - Get specific user
- DELETE `/users/:id` - Delete user
- PATCH `/users/:id/role` - Update user role
- GET `/stats` - Get statistics
- GET `/logs` - View system logs

#### Product Routes (`/products`)
- GET `/` - List all products
- GET `/:id` - Get single product
- POST `/` - Create product
- PATCH `/:id` - Update product
- DELETE `/:id` - Delete product
- GET `/search` - Search products
- GET `/category/:category` - Get by category

#### Order Routes (`/orders`)
- GET `/` - Get user's orders
- GET `/:id` - Get specific order
- POST `/` - Create new order
- PATCH `/:id` - Update order
- DELETE `/:id` - Cancel order
- GET `/:id/status` - Get order status

#### Profile Routes (`/profile`)
- GET `/` - Get own profile
- PATCH `/` - Update profile
- POST `/avatar` - Upload avatar
- DELETE `/avatar` - Delete avatar
- GET `/posts` - Get user's posts
- GET `/followers` - Get followers

</details>

---

<details>
<summary><strong>Complete Implementation</strong></summary>

### Project Structure
```
project/
├── config/
│   └── database.js
├── models/
│   ├── user.js
│   └── product.js
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── adminController.js
│   └── productController.js
├── middleware/
│   ├── auth.js
│   └── isAdmin.js
├── routes/
│   ├── auth.js
│   ├── user.js
│   ├── admin.js
│   └── product.js
├── app.js
└── server.js
```

### Authentication Router
```javascript
// routes/auth.js
const express = require("express");
const router = express.Router();
const {
    signup,
    login,
    logout,
    forgotPassword,
    resetPassword
} = require("../controllers/authController");

// POST /auth/signup
router.post("/signup", signup);

// POST /auth/login
router.post("/login", login);

// POST /auth/logout
router.post("/logout", logout);

// POST /auth/forgot-password
router.post("/forgot-password", forgotPassword);

// POST /auth/reset-password/:token
router.post("/reset-password/:token", resetPassword);

module.exports = router;
```

### User Router
```javascript
// routes/user.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
    getProfile,
    updateProfile,
    deleteAccount,
    changePassword
} = require("../controllers/userController");

// All user routes require authentication
router.use(auth);

// GET /user/profile
router.get("/profile", getProfile);

// PATCH /user/profile
router.patch("/profile", updateProfile);

// DELETE /user/account
router.delete("/account", deleteAccount);

// PATCH /user/password
router.patch("/password", changePassword);

module.exports = router;
```

### Admin Router
```javascript
// routes/admin.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const {
    getAllUsers,
    getUserById,
    deleteUser,
    updateUserRole,
    getStats
} = require("../controllers/adminController");

// All admin routes require authentication and admin role
router.use(auth);
router.use(isAdmin);

// GET /admin/users
router.get("/users", getAllUsers);

// GET /admin/users/:id
router.get("/users/:id", getUserById);

// DELETE /admin/users/:id
router.delete("/users/:id", deleteUser);

// PATCH /admin/users/:id/role
router.patch("/users/:id/role", updateUserRole);

// GET /admin/stats
router.get("/stats", getStats);

module.exports = router;
```

### Product Router
```javascript
// routes/product.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    searchProducts
} = require("../controllers/productController");

// Public routes
router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/:id", getProductById);

// Protected routes (require authentication)
router.post("/", auth, createProduct);
router.patch("/:id", auth, updateProduct);
router.delete("/:id", auth, deleteProduct);

module.exports = router;
```

### Main App File
```javascript
// app.js
const express = require("express");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/database");

// Import routers
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const productRoutes = require("./routes/product");

const app = express();

// Global middleware
app.use(express.json());
app.use(cookieParser());

// Mount routers
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/admin", adminRoutes);
app.use("/products", productRoutes);

// Health check route
app.get("/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

module.exports = app;
```

### Server File
```javascript
// server.js
const app = require("./app");
const connectDB = require("./config/database");

const PORT = process.env.PORT || 8888;

connectDB()
    .then(() => {
        console.log("Database connected successfully!");
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("Database connection error:", err);
        process.exit(1);
    });
```

### Sample Controller
```javascript
// controllers/authController.js
const User = require("../models/user");
const validator = require("validator");

exports.signup = async (req, res) => {
    try {
        const { firstName, lastName, emailId, password } = req.body;
        
        if (!validator.isEmail(emailId)) {
            throw new Error("Invalid email!");
        }
        
        const user = new User({
            firstName,
            lastName,
            emailId,
            password
        });
        
        await user.save();
        
        const token = user.getJWT();
        res.cookie("token", token, { httpOnly: true });
        
        res.status(201).json({
            message: "User created successfully!",
            user: user.getPublicProfile()
        });
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { emailId, password } = req.body;
        
        if (!validator.isEmail(emailId)) {
            throw new Error("Invalid credentials!");
        }
        
        const user = await User.findOne({ emailId });
        
        if (!user) {
            throw new Error("Invalid credentials!");
        }
        
        const isPasswordValid = await user.validatePassword(password);
        
        if (!isPasswordValid) {
            throw new Error("Invalid credentials!");
        }
        
        const token = user.getJWT();
        res.cookie("token", token, { httpOnly: true });
        
        res.json({
            message: "Login successful!",
            user: user.getPublicProfile()
        });
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.logout = (req, res) => {
    res.cookie("token", null, { expires: new Date(Date.now()) });
    res.json({ message: "Logout successful!" });
};
```

</details>

---

<details>
<summary><strong>Router-Level Middleware</strong></summary>

### Apply Middleware to All Routes in Router
```javascript
// routes/user.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// This middleware applies to ALL routes in this router
router.use(auth);

// All these routes are now protected
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.delete("/account", deleteAccount);

module.exports = router;
```

### Apply Middleware to Specific Routes
```javascript
// routes/product.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// Public routes (no auth required)
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Protected routes (auth required)
router.post("/", auth, createProduct);
router.patch("/:id", auth, updateProduct);
router.delete("/:id", auth, deleteProduct);

module.exports = router;
```

### Multiple Middleware
```javascript
// routes/admin.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const isAdmin = require("../middleware/isAdmin");
const rateLimit = require("../middleware/rateLimit");

// Apply multiple middleware
router.use(auth);           // First: Check authentication
router.use(isAdmin);        // Second: Check admin role
router.use(rateLimit);      // Third: Rate limiting

router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

module.exports = router;
```

### Conditional Middleware
```javascript
// routes/product.js
const router = express.Router();

// Different middleware for different methods
router.route("/:id")
    .get(getProduct)                    // Public
    .patch(auth, updateProduct)         // Requires auth
    .delete(auth, isAdmin, deleteProduct); // Requires auth + admin

module.exports = router;
```

### Logging Middleware for Router
```javascript
// routes/admin.js
const router = express.Router();

// Custom logging for this router only
router.use((req, res, next) => {
    console.log(`Admin Route: ${req.method} ${req.path}`);
    next();
});

router.get("/users", getAllUsers);
router.get("/stats", getStats);

module.exports = router;
```

</details>

---

<details>
<summary><strong>Route Parameters and Query Strings</strong></summary>

### Route Parameters
```javascript
// routes/user.js
const router = express.Router();

// GET /user/:id
router.get("/:id", (req, res) => {
    const userId = req.params.id;
    res.json({ userId });
});

// GET /user/:id/posts/:postId
router.get("/:id/posts/:postId", (req, res) => {
    const { id, postId } = req.params;
    res.json({ userId: id, postId });
});

module.exports = router;
```

### Query Strings
```javascript
// routes/product.js
const router = express.Router();

// GET /products?category=electronics&sort=price&limit=10
router.get("/", (req, res) => {
    const { category, sort, limit } = req.query;
    res.json({ category, sort, limit });
});

module.exports = router;
```

### Combining Parameters and Query
```javascript
// routes/user.js
// GET /user/123/posts?page=2&limit=10
router.get("/:id/posts", (req, res) => {
    const userId = req.params.id;
    const { page, limit } = req.query;
    
    res.json({
        userId,
        page: page || 1,
        limit: limit || 10
    });
});
```

### Route Chaining
```javascript
// routes/product.js
router.route("/:id")
    .get((req, res) => {
        res.send(`Get product ${req.params.id}`);
    })
    .patch((req, res) => {
        res.send(`Update product ${req.params.id}`);
    })
    .delete((req, res) => {
        res.send(`Delete product ${req.params.id}`);
    });
```

</details>

---

<details>
<summary><strong>Best Practices</strong></summary>

### 1. Group Related Routes Together
```javascript
// ✅ Good - Related routes in same file
// routes/auth.js
router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

// ❌ Bad - Scattered across multiple files
```

### 2. Use Consistent Naming
```javascript
// ✅ Good - Consistent naming
routes/
  ├── auth.js         → /auth/*
  ├── user.js         → /user/*
  ├── product.js      → /products/*
  └── admin.js        → /admin/*

// ❌ Bad - Inconsistent naming
routes/
  ├── authentication.js
  ├── userRoutes.js
  ├── prod.js
```

### 3. Apply Middleware at Router Level
```javascript
// ✅ Good - DRY principle
router.use(auth);
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);

// ❌ Bad - Repetitive
router.get("/profile", auth, getProfile);
router.patch("/profile", auth, updateProfile);
```

### 4. Use Controllers for Business Logic
```javascript
// ✅ Good - Separate concerns
// routes/user.js
router.get("/profile", userController.getProfile);

// controllers/userController.js
exports.getProfile = async (req, res) => {
    // Business logic here
};

// ❌ Bad - Logic in routes
router.get("/profile", async (req, res) => {
    // 50 lines of business logic
});
```

### 5. Version Your API
```javascript
// app.js
const v1Routes = require("./routes/v1");
const v2Routes = require("./routes/v2");

app.use("/api/v1", v1Routes);
app.use("/api/v2", v2Routes);
```

### 6. Add Route Documentation
```javascript
// routes/user.js
/**
 * @route   GET /user/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get("/profile", auth, getProfile);

/**
 * @route   PATCH /user/profile
 * @desc    Update user profile
 * @access  Private
 */
router.patch("/profile", auth, updateProfile);
```

### 7. Handle 404 Routes
```javascript
// app.js
app.use("/auth", authRoutes);
app.use("/user", userRoutes);

// 404 handler at the end
app.use((req, res) => {
    res.status(404).json({
        error: "Route not found",
        path: req.path
    });
});
```

### 8. Use Route Prefixes
```javascript
// ✅ Good - Clear prefixes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// URLs: /api/auth/login, /api/user/profile, etc.
```

</details>

---

<details>
<summary><strong>Common Mistakes</strong></summary>

### Mistake 1: Not Exporting Router
```javascript
// ❌ Wrong - forgot to export
const router = express.Router();
router.get("/profile", getProfile);
// Missing: module.exports = router;

// ✅ Correct
module.exports = router;
```

### Mistake 2: Creating New Router in Main File
```javascript
// ❌ Wrong
const router = express.Router();  // Don't create here
const authRoutes = require("./routes/auth");

// ✅ Correct - Just import and use
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);
```

### Mistake 3: Duplicate Route Paths
```javascript
// ❌ Wrong - duplicate paths
router.get("/profile", getProfile);
router.get("/profile", getSettings);  // Second one wins!

// ✅ Correct - unique paths
router.get("/profile", getProfile);
router.get("/settings", getSettings);
```

### Mistake 4: Wrong Order of Middleware
```javascript
// ❌ Wrong - middleware after routes
router.get("/profile", getProfile);
router.use(auth);  // Too late! Doesn't affect above route

// ✅ Correct - middleware before routes
router.use(auth);
router.get("/profile", getProfile);
```

### Mistake 5: Incorrect Path Mounting
```javascript
// routes/user.js
router.get("/user/profile", getProfile);  // ❌ Wrong

// app.js
app.use("/user", userRoutes);

// Result: /user/user/profile (duplicate!)

// ✅ Correct
// routes/user.js
router.get("/profile", getProfile);

// app.js
app.use("/user", userRoutes);

// Result: /user/profile ✓
```

### Mistake 6: Not Handling Async Errors
```javascript
// ❌ Wrong - unhandled promise rejection
router.get("/profile", async (req, res) => {
    const user = await User.findById(req.user.id);
    res.json(user);  // If error occurs, server crashes
});

// ✅ Correct - use try-catch
router.get("/profile", async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
```

</details>

---

## Quick Reference

### Create Router
```javascript
const express = require("express");
const router = express.Router();

router.get("/path", handler);
router.post("/path", handler);

module.exports = router;
```

### Mount Router
```javascript
const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);
```

### Apply Middleware
```javascript
// All routes
router.use(auth);

// Specific routes
router.get("/public", handler);
router.get("/protected", auth, handler);
```

### Route Chaining
```javascript
router.route("/:id")
    .get(getHandler)
    .patch(updateHandler)
    .delete(deleteHandler);
```

</details>

<span>

## Indexes and Compound Indexes in DB, schema.pre
As the collecitons grow the query operations become expensive they become very slow as db has to deal with so much data

For that we need indexes in our database
Role of index: 

Lets say we have 1 million users and in that we have 100 people with the name Virat
it will become tough to findout since db has to go through every record and search for the name
But if you keep index on the data base for the firstname, the db will optimize itself like that and 
the query becomes very fast

if we keep firstName as the index, then whenever I query something with firstname, then the query 
will be very fast otherwise the query would be very slow

If you define a field in schema with unique: true then mongodb automatically creates index for that 
</span>


Compound Indexes 

Creating index unnecessarily also comes with a cost


<details>
<summary><strong>📊 MongoDB Indexes and Query Optimization</strong></summary>

<details>
<summary><strong>Table of Contents</strong></summary>

- [What are Indexes?](#what-are-indexes)
- [Why Use Indexes?](#why-use-indexes)
- [How Indexes Work](#how-indexes-work)
- [Types of Indexes](#types-of-indexes)
- [Creating Indexes in Mongoose](#creating-indexes-in-mongoose)
- [Compound Indexes](#compound-indexes)
- [Schema Pre-Save Middleware](#schema-pre-save-middleware)
- [Complete Implementation](#complete-implementation)
- [Index Best Practices](#index-best-practices)
- [Common Mistakes](#common-mistakes)
- [Performance Considerations](#performance-considerations)

</details>

---

<details>
<summary><strong>What are Indexes?</strong></summary>

**Indexes** are special data structures that MongoDB uses to quickly locate data without scanning every document in a collection.

### Analogy: Book Index vs Reading Every Page

#### Without Index (Full Collection Scan) ❌
```
Finding "Virat" in 1 million users:
┌─────────────────────────────────────┐
│ User 1: firstName: "John"           │ ← Check
│ User 2: firstName: "Sarah"          │ ← Check
│ User 3: firstName: "Mike"           │ ← Check
│ ...                                 │
│ User 999,998: firstName: "Emma"     │ ← Check
│ User 999,999: firstName: "Virat"    │ ← Found! (after checking 999,999 records)
│ User 1,000,000: firstName: "Alex"   │ ← Check
└─────────────────────────────────────┘
Time: Very Slow (scans all 1 million documents)
```

#### With Index (Optimized Lookup) ✅
```
Finding "Virat" with firstName index:
┌──────────────────────┐
│ Index Structure      │
│ A → [Users 1-5000]   │
│ B → [Users 5001-...]  │
│ ...                  │
│ V → [Users with V]   │ ← Direct lookup
│   └─ Virat: [100]    │ ← Found instantly
└──────────────────────┘
Time: Very Fast (direct lookup to 100 matching documents)
```

### Key Concepts

- **Without Index**: Database scans every document (slow)
- **With Index**: Database uses optimized data structure (fast)
- **Trade-off**: Faster reads, but slightly slower writes (index must be updated)

</details>

---

<details>
<summary><strong>Why Use Indexes?</strong></summary>

### Problem: Slow Queries on Large Collections
```javascript
// Collection with 1 million users
// Query without index
const users = await User.find({ firstName: "Virat" });

// MongoDB scans ALL 1 million documents
// Time: 5-10 seconds (very slow!)
```

### Solution: Create Index
```javascript
// Create index on firstName
userSchema.index({ firstName: 1 });

// Same query with index
const users = await User.find({ firstName: "Virat" });

// MongoDB uses index to find matching documents
// Time: 10-50 milliseconds (very fast!)
```

### Performance Comparison

| Collection Size | Without Index | With Index |
|----------------|---------------|------------|
| 1,000 users | 10ms | 2ms |
| 10,000 users | 100ms | 5ms |
| 100,000 users | 1s | 10ms |
| 1,000,000 users | 10s | 20ms |
| 10,000,000 users | 100s+ | 50ms |

### When to Use Indexes

✅ **Use indexes when:**
- Frequently querying by specific fields
- Large collections (thousands+ documents)
- Need fast search/filter operations
- Sorting by specific fields
- Unique constraints required

❌ **Don't use indexes when:**
- Small collections (< 1000 documents)
- Fields rarely queried
- Too many indexes (overhead on writes)
- Frequently updated fields (index rebuilding cost)

</details>

---

<details>
<summary><strong>How Indexes Work</strong></summary>

### Without Index: Full Collection Scan
```javascript
// Query: Find users named "Virat"
User.find({ firstName: "Virat" })

// MongoDB process:
// 1. Start at first document
// 2. Check firstName field
// 3. If matches "Virat", add to results
// 4. Move to next document
// 5. Repeat for ALL documents
// 6. Return results

// Total documents scanned: 1,000,000
// Time complexity: O(n)
```

### With Index: Optimized Lookup
```javascript
// Create index
userSchema.index({ firstName: 1 });

// Query: Find users named "Virat"
User.find({ firstName: "Virat" })

// MongoDB process:
// 1. Look up "Virat" in firstName index
// 2. Index returns document IDs with firstName="Virat"
// 3. Fetch only those documents
// 4. Return results

// Total documents scanned: 100 (only matching ones)
// Time complexity: O(log n)
```

### Index Data Structure (B-Tree)
```
                    [M-Z]
                   /      \
              [A-L]        [N-Z]
             /    \          /    \
        [A-F]  [G-L]    [N-S]  [T-Z]
         /  \    /  \     /  \    /  \
       [A] [D] [G] [J] [N] [P] [T] [V]
                                    |
                                 "Virat" → [Doc IDs: 123, 456, 789, ...]
```

### Automatic Indexes

MongoDB automatically creates indexes for:

1. **`_id` field** (always indexed, unique)
2. **`unique: true` fields** (automatically indexed)
```javascript
const userSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,  // Automatically indexed
    emailId: {
        type: String,
        unique: true  // Automatically creates index
    }
});
```

</details>

---

<details>
<summary><strong>Types of Indexes</strong></summary>

### 1. Single Field Index

Index on one field only.
```javascript
// Index on firstName (ascending)
userSchema.index({ firstName: 1 });

// Index on age (descending)
userSchema.index({ age: -1 });

// Usage
User.find({ firstName: "Virat" });  // Uses firstName index
User.find({ age: { $gte: 25 } });   // Uses age index
```

### 2. Compound Index

Index on multiple fields together.
```javascript
// Compound index on firstName AND lastName
userSchema.index({ firstName: 1, lastName: 1 });

// Efficient queries:
User.find({ firstName: "Venkata", lastName: "Esam" });  // Uses compound index
User.find({ firstName: "Venkata" });  // Uses compound index (leftmost prefix)

// Inefficient query:
User.find({ lastName: "Esam" });  // Cannot use compound index efficiently
```

### 3. Unique Index

Ensures field values are unique across collection.
```javascript
const userSchema = new mongoose.Schema({
    emailId: {
        type: String,
        unique: true  // Creates unique index automatically
    }
});

// Prevents duplicate emails
// Trying to insert duplicate email throws error
```

### 4. Text Index

For text search functionality.
```javascript
// Text index on bio field
userSchema.index({ bio: "text" });

// Text search
User.find({ $text: { $search: "developer nodejs" } });
```

### 5. Geospatial Index

For location-based queries.
```javascript
// Geospatial index
userSchema.index({ location: "2dsphere" });

// Find nearby users
User.find({
    location: {
        $near: {
            $geometry: { type: "Point", coordinates: [lng, lat] },
            $maxDistance: 5000  // 5km radius
        }
    }
});
```

### Index Direction
```javascript
// 1 = Ascending order
userSchema.index({ age: 1 });

// -1 = Descending order
userSchema.index({ createdAt: -1 });

// For compound indexes, direction matters for sorting
userSchema.index({ age: 1, createdAt: -1 });
```

</details>

---

<details>
<summary><strong>Creating Indexes in Mongoose</strong></summary>

### Method 1: Schema-Level Index (Recommended)
```javascript
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    emailId: {
        type: String,
        required: true,
        unique: true  // Automatically creates unique index
    },
    age: Number
});

// Create single field index
userSchema.index({ firstName: 1 });

// Create compound index
userSchema.index({ firstName: 1, lastName: 1 });

// Create index with options
userSchema.index(
    { emailId: 1 },
    { unique: true, sparse: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
```

### Method 2: Field-Level Index
```javascript
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        index: true  // Creates index on this field
    },
    emailId: {
        type: String,
        unique: true  // Creates unique index
    }
});
```

### Method 3: Using Model
```javascript
// After model is created (not recommended for production)
User.createIndexes();
```

### Index Options
```javascript
userSchema.index(
    { firstName: 1, lastName: 1 },
    {
        name: "fullname_index",     // Custom index name
        unique: true,               // Unique constraint
        sparse: true,               // Only index documents with this field
        background: true,           // Build index in background
        expireAfterSeconds: 3600    // TTL index (auto-delete after 1 hour)
    }
);
```

</details>

---

<details>
<summary><strong>Compound Indexes</strong></summary>

### What are Compound Indexes?

**Compound indexes** are indexes on multiple fields. They optimize queries that filter or sort by multiple fields.

### Why Use Compound Indexes?
```javascript
// Without compound index
User.find({ firstName: "Venkata", lastName: "Esam" })
// MongoDB scans all documents with firstName="Venkata"
// Then filters by lastName="Esam"
// Slow for large datasets

// With compound index
userSchema.index({ firstName: 1, lastName: 1 });
User.find({ firstName: "Venkata", lastName: "Esam" })
// MongoDB directly finds documents with BOTH conditions
// Very fast!
```

### Creating Compound Indexes
```javascript
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    age: Number,
    city: String
});

// Compound index on firstName and lastName
userSchema.index({ firstName: 1, lastName: 1 });

// Compound index on city and age
userSchema.index({ city: 1, age: 1 });

const User = mongoose.model("User", userSchema);
```

### Leftmost Prefix Rule

Compound index `{ firstName: 1, lastName: 1 }` can be used for:
```javascript
// ✅ Uses index efficiently
User.find({ firstName: "Venkata" });
User.find({ firstName: "Venkata", lastName: "Esam" });

// ❌ Cannot use index efficiently
User.find({ lastName: "Esam" });  // Skips firstName (leftmost)
```

### Example: Connection Request Schema
```javascript
const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ["ignored", "interested", "accepted", "rejected"],
            message: `{VALUE} is not supported`
        }
    }
}, {
    timestamps: true
});

// Compound index on senderId and receiverId
connectionRequestSchema.index({ senderId: 1, receiverId: 1 });

const ConnectionRequest = mongoose.model("ConnectionRequest", connectionRequestSchema);
module.exports = ConnectionRequest;
```

### Query Performance with Compound Index
```javascript
// ✅ Very fast - uses compound index
ConnectionRequest.find({
    senderId: "507f1f77bcf86cd799439011",
    receiverId: "507f1f77bcf86cd799439012"
});

// ✅ Fast - uses compound index (leftmost prefix)
ConnectionRequest.find({
    senderId: "507f1f77bcf86cd799439011"
});

// ⚠️ Slower - cannot use compound index efficiently
ConnectionRequest.find({
    receiverId: "507f1f77bcf86cd799439012"
});
```

### Multiple Compound Indexes
```javascript
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    age: Number,
    city: String,
    country: String
});

// Multiple compound indexes for different query patterns
userSchema.index({ firstName: 1, lastName: 1 });     // For name searches
userSchema.index({ city: 1, country: 1 });          // For location searches
userSchema.index({ age: 1, city: 1 });              // For age+location searches

const User = mongoose.model("User", userSchema);
```

### Compound Index Example: User Schema
```javascript
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    emailId: {
        type: String,
        unique: true
    },
    age: Number,
    city: String
});

// Compound index for full name searches
userSchema.index({ firstName: 1, lastName: 1 });

const User = mongoose.model("User", userSchema);

// Efficient queries
User.find({ firstName: "Venkata", lastName: "Esam" });  // Uses index
User.find({ firstName: "Venkata" });  // Uses index (leftmost prefix)
```

</details>

---

<details>
<summary><strong>Schema Pre-Save Middleware</strong></summary>

### What is Pre-Save Middleware?

**Pre-save middleware** (also called pre-save hooks) runs before a document is saved to the database. It's useful for validation, data transformation, and business logic.

### Basic Syntax
```javascript
schema.pre("save", function(next) {
    // 'this' refers to the document being saved
    // Perform validations or transformations
    next();  // Call next() to continue saving
});
```

### Example: Prevent Self-Connection
```javascript
const connectionRequestSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    status: {
        type: String,
        enum: ["ignored", "interested", "accepted", "rejected"]
    }
});

// Pre-save middleware
connectionRequestSchema.pre("save", function(next) {
    const connectionRequest = this;
    
    // Check if sender and receiver are the same
    if (connectionRequest.senderId.equals(connectionRequest.receiverId)) {
        throw new Error("Cannot send connection to yourself");
    }
    
    next();  // Continue with save
});

const ConnectionRequest = mongoose.model("ConnectionRequest", connectionRequestSchema);
```

### Usage
```javascript
// This will trigger pre-save middleware
const request = new ConnectionRequest({
    senderId: "507f1f77bcf86cd799439011",
    receiverId: "507f1f77bcf86cd799439011",  // Same as sender
    status: "interested"
});

await request.save();  // Error: "Cannot send connection to yourself"
```

### Common Use Cases

#### 1. Data Validation
```javascript
userSchema.pre("save", function(next) {
    const user = this;
    
    if (user.age < 18) {
        throw new Error("User must be at least 18 years old");
    }
    
    next();
});
```

#### 2. Data Transformation
```javascript
userSchema.pre("save", function(next) {
    const user = this;
    
    // Convert email to lowercase
    if (user.emailId) {
        user.emailId = user.emailId.toLowerCase();
    }
    
    // Capitalize first name
    if (user.firstName) {
        user.firstName = user.firstName.charAt(0).toUpperCase() + 
                        user.firstName.slice(1).toLowerCase();
    }
    
    next();
});
```

#### 3. Timestamp Management
```javascript
userSchema.pre("save", function(next) {
    if (this.isNew) {
        this.createdAt = new Date();
    }
    this.updatedAt = new Date();
    next();
});
```

#### 4. Password Hashing (Already Covered)
```javascript
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return next();
    }
    
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
```

### Multiple Pre-Save Hooks
```javascript
// First hook - validation
userSchema.pre("save", function(next) {
    if (this.age < 18) {
        throw new Error("Must be 18+");
    }
    next();
});

// Second hook - transformation
userSchema.pre("save", function(next) {
    this.emailId = this.emailId.toLowerCase();
    next();
});

// Hooks execute in order
```

### Async Pre-Save Middleware
```javascript
userSchema.pre("save", async function(next) {
    try {
        // Async operations
        const exists = await User.findOne({ emailId: this.emailId });
        
        if (exists && !this._id.equals(exists._id)) {
            throw new Error("Email already exists");
        }
        
        next();
    } catch (error) {
        next(error);
    }
});
```

</details>

---

<details>
<summary><strong>Complete Implementation</strong></summary>

### Connection Request Model
```javascript
// models/connectionRequest.js
const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",  // Reference to User model
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ["ignored", "interested", "accepted", "rejected"],
            message: `{VALUE} is not a valid status`
        }
    }
}, {
    timestamps: true  // Automatically adds createdAt and updatedAt
});

// Compound index for efficient queries
connectionRequestSchema.index({ senderId: 1, receiverId: 1 });

// Pre-save middleware - prevent self-connection
connectionRequestSchema.pre("save", function(next) {
    const connectionRequest = this;
    
    // Check if sender is trying to connect with themselves
    if (connectionRequest.senderId.equals(connectionRequest.receiverId)) {
        return next(new Error("Cannot send connection request to yourself"));
    }
    
    next();
});

// Pre-save middleware - prevent duplicate requests
connectionRequestSchema.pre("save", async function(next) {
    try {
        const connectionRequest = this;
        
        // Check if request already exists
        const existingRequest = await ConnectionRequest.findOne({
            $or: [
                { senderId: connectionRequest.senderId, receiverId: connectionRequest.receiverId },
                { senderId: connectionRequest.receiverId, receiverId: connectionRequest.senderId }
            ]
        });
        
        if (existingRequest) {
            return next(new Error("Connection request already exists"));
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

const ConnectionRequest = mongoose.model("ConnectionRequest", connectionRequestSchema);

module.exports = ConnectionRequest;
```

### User Model with Indexes
```javascript
// models/user.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    emailId: {
        type: String,
        required: true,
        unique: true,  // Automatically creates unique index
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        min: 18
    },
    city: String,
    country: String
}, {
    timestamps: true
});

// Compound index for full name searches
userSchema.index({ firstName: 1, lastName: 1 });

// Compound index for location searches
userSchema.index({ city: 1, country: 1 });

// Pre-save middleware - hash password
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) {
        return next();
    }
    
    try {
        this.password = await bcrypt.hash(this.password, 10);
        next();
    } catch (error) {
        next(error);
    }
});

// Schema methods
userSchema.methods.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
```

### Using the Models
```javascript
// Send connection request
app.post("/connection/send/:receiverId", auth, async (req, res) => {
    try {
        const senderId = req.user._id;
        const receiverId = req.params.receiverId;
        
        // Create connection request
        const connectionRequest = new ConnectionRequest({
            senderId,
            receiverId,
            status: "interested"
        });
        
        // Pre-save middleware will run here
        await connectionRequest.save();
        
        res.status(201).json({
            message: "Connection request sent!",
            request: connectionRequest
        });
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all connection requests for a user
app.get("/connection/requests", auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Uses compound index for fast query
        const requests = await ConnectionRequest.find({
            receiverId: userId,
            status: "interested"
        }).populate("senderId", "firstName lastName");
        
        res.json(requests);
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Search users by name
app.get("/users/search", async (req, res) => {
    try {
        const { firstName, lastName } = req.query;
        
        // Uses compound index for fast search
        const users = await User.find({
            firstName: firstName,
            lastName: lastName
        }).select("firstName lastName emailId");
        
        res.json(users);
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

</details>

---

<details>
<summary><strong>Index Best Practices</strong></summary>

### 1. Index Frequently Queried Fields
```javascript
// ✅ Good - index fields used in queries
userSchema.index({ emailId: 1 });  // Frequently queried
userSchema.index({ firstName: 1, lastName: 1 });  // Common search

// ❌ Bad - indexing rarely used fields
userSchema.index({ middleName: 1 });  // Rarely queried
```

### 2. Use Compound Indexes for Multiple Field Queries
```javascript
// ✅ Good - single compound index
userSchema.index({ city: 1, age: 1 });
User.find({ city: "Hyderabad", age: 25 });

// ❌ Bad - separate indexes (less efficient)
userSchema.index({ city: 1 });
userSchema.index({ age: 1 });
```

### 3. Don't Over-Index
```javascript
// ❌ Bad - too many indexes
userSchema.index({ firstName: 1 });
userSchema.index({ lastName: 1 });
userSchema.index({ age: 1 });
userSchema.index({ city: 1 });
userSchema.index({ country: 1 });
userSchema.index({ phone: 1 });
// Slows down writes significantly

// ✅ Good - strategic indexes
userSchema.index({ emailId: 1 });  // unique, frequently queried
userSchema.index({ firstName: 1, lastName: 1 });  // compound for names
```

### 4. Consider Query Patterns
```javascript
// Most common query pattern
User.find({ city: "Hyderabad", age: { $gte: 25 } });

// Create index matching query pattern
userSchema.index({ city: 1, age: 1 });  // Perfect match
```

### 5. Index Order Matters for Compound Indexes
```javascript
// Query pattern: filter by city, sort by age
User.find({ city: "Hyderabad" }).sort({ age: -1 });

// ✅ Good - matches query pattern
userSchema.index({ city: 1, age: -1 });

// ❌ Less efficient
userSchema.index({ age: -1, city: 1 });
```

### 6. Use Unique Indexes for Unique Fields
```javascript
// ✅ Good - prevents duplicates at database level
userSchema.index({ emailId: 1 }, { unique: true });

// ❌ Bad - only application-level validation
const userSchema = new mongoose.Schema({
    emailId: {
        type: String,
        validate: {
            validator: async function(email) {
                const user = await User.findOne({ emailId: email });
                return !user;
            }
        }
    }
});
```

### 7. Monitor Index Usage
```javascript
// Check which indexes are being used
User.collection.getIndexes().then(indexes => {
    console.log(indexes);
});

// Explain query to see index usage
User.find({ firstName: "Virat" }).explain("executionStats").then(result => {
    console.log(result);
});
```

### 8. Drop Unused Indexes
```javascript
// Drop specific index
User.collection.dropIndex("firstName_1");

// Drop all indexes except _id
User.collection.dropIndexes();
```

</details>

---

<details>
<summary><strong>Common Mistakes</strong></summary>

### Mistake 1: Not Using Indexes for Frequent Queries
```javascript
// ❌ Wrong - no index on frequently queried field
const userSchema = new mongoose.Schema({
    emailId: String  // No index
});

User.find({ emailId: "test@example.com" });  // Slow on large collections

// ✅ Correct
const userSchema = new mongoose.Schema({
    emailId: {
        type: String,
        unique: true  // Creates index
    }
});
```

### Mistake 2: Creating Too Many Indexes
```javascript
// ❌ Wrong - over-indexing
userSchema.index({ firstName: 1 });
userSchema.index({ lastName: 1 });
userSchema.index({ age: 1 });
userSchema.index({ city: 1 });
userSchema.index({ country: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ address: 1 });
// Every write operation updates 8 indexes!

// ✅ Correct - only necessary indexes
userSchema.index({ emailId: 1 }, { unique: true });
userSchema.index({ firstName: 1, lastName: 1 });
userSchema.index({ city: 1, country: 1 });
```

### Mistake 3: Wrong Compound Index Order
```javascript
// Common query: Find by receiverId
ConnectionRequest.find({ receiverId: userId });

// ❌ Wrong - receiverId is not leftmost
connectionRequestSchema.index({ senderId: 1, receiverId: 1 });

// ✅ Correct - add separate index or reorder
connectionRequestSchema.index({ receiverId: 1, senderId: 1 });
// OR
connectionRequestSchema.index({ senderId: 1, receiverId: 1 });
connectionRequestSchema.index({ receiverId: 1 });  // Separate index
```

### Mistake 4: Not Using `next()` in Pre-Save
```javascript
// ❌ Wrong - forgot to call next()
userSchema.pre("save", function() {
    this.emailId = this.emailId.toLowerCase();
    // Missing next()! Save will hang
});

// ✅ Correct
userSchema.pre("save", function(next) {
    this.emailId = this.emailId.toLowerCase();
    next();
});
```

### Mistake 5: Using Arrow Functions in Pre-Save
```javascript
// ❌ Wrong - arrow function breaks 'this'
userSchema.pre("save", () => {
    this.emailId = this.emailId.toLowerCase();  // 'this' is undefined!
    next();
});

// ✅ Correct - regular function
userSchema.pre("save", function(next) {
    this.emailId = this.emailId.toLowerCase();
    next();
});
```

### Mistake 6: Not Handling Async Errors in Pre-Save
```javascript
// ❌ Wrong - unhandled async errors
userSchema.pre("save", async function(next) {
    const exists = await User.findOne({ emailId: this.emailId });
    if (exists) {
        throw new Error("Email exists");  // Error not passed to next()
    }
});

// ✅ Correct - pass errors to next()
userSchema.pre("save", async function(next) {
    try {
        const exists = await User.findOne({ emailId: this.emailId });
        if (exists) {
            return next(new Error("Email exists"));
        }
        next();
    } catch (error) {
        next(error);
    }
});
```

</details>

---

<details>
<summary><strong>Performance Considerations</strong></summary>

### Index vs No Index Performance
```javascript
// Collection: 1 million users

// WITHOUT INDEX
console.time("No Index");
await User.find({ firstName: "Virat" });
console.timeEnd("No Index");
// Output: No Index: 8547ms (8.5 seconds)

// WITH INDEX
userSchema.index({ firstName: 1 });

console.time("With Index");
await User.find({ firstName: "Virat" });
console.timeEnd("With Index");
// Output: With Index: 23ms (0.023 seconds)

// 370x faster!
```

### Write Performance Impact
```javascript
// Without indexes: Fast writes
await User.create({ firstName: "John", ... });  // 5ms

// With 5 indexes: Slower writes (each index must be updated)
await User.create({ firstName: "John", ... });  // 15ms

// Trade-off: Slower writes for much faster reads
```

### Memory Usage
```javascript
// Indexes consume memory
// Rule of thumb: ~10-15% of data size for indexes

// Collection size: 1GB
// Estimated index size: 100-150MB
// Total memory: 1.1-1.15GB

### When Indexes Don't Help
```javascript
// 1. Small collections (< 1000 documents)
//    Full scan is fast enough

// 2. Queries returning large percentage of documents
User.find({ age: { $gte: 18 } });  // Returns 95% of documents
// Index overhead not worth it

// 3. Queries on non-indexed fields
User.find({ middleName: "Kumar" });  // No index on middleName
// Falls back to collection scan
```

### Optimizing Query Performance
```javascript
// Use .explain() to analyze queries
User.find({ firstName: "Virat" })
    .explain("executionStats")
    .then(result => {
        console.log("Execution time:", result.executionTimeMillis);
        console.log("Documents examined:", result.executionStats.totalDocsExamined);
        console.log("Index used:", result.executionStats.executionStages.indexName);
    });
```

</details>

---

## Quick Reference

### Create Single Index
```javascript
userSchema.index({ fieldName: 1 });  // 1 = ascending, -1 = descending
```

### Create Compound Index
```javascript
userSchema.index({ field1: 1, field2: 1 });
```

### Create Unique Index
```javascript
userSchema.index({ emailId: 1 }, { unique: true });
// OR
emailId: { type: String, unique: true }
```

### Pre-Save Middleware
```javascript
schema.pre("save", function(next) {
    // Validation or transformation
    next();
});
```

### Prevent Self-Reference
```javascript
schema.pre("save", function(next) {
    if (this.senderId.equals(this.receiverId)) {
        return next(new Error("Cannot reference self"));
    }
    next();
});
```

### Check Index Usage
```javascript
Model.collection.getIndexes();
Model.find(query).explain("executionStats");
```

</details>


Building relation between two tables by using reference and query population


you write ref: "User"


```javascript
const connectionRequestSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref:"User" //reference to user collection
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ["ignored", "interested", "accepted", "rejected"],
            message: `{VALUE} is not supported`
        }
    },

},
```
```json
{
    "message": "Connection requests fetched successfully",
    "data": [
        {
            "_id": "696fe15d506e4e3bf394ac3b",
            "senderId": {
                "_id": "696f97d50dfe1d8f9e53014b",
                "firstName": "Vikram",
                "lastName": "Hasan"
            },
            "receiverId": "696fbcd629d4c7bc38d54e33",
            "status": "interested",
            "createdAt": "2026-01-20T20:11:09.092Z",
            "updatedAt": "2026-01-20T20:11:09.092Z",
            "__v": 0
        }
    ]
}
```

<details>
<summary><strong>🔗 MongoDB Relations - Reference & Population</strong></summary>

<details>
<summary><strong>Table of Contents</strong></summary>

- [What are References?](#what-are-references)
- [Why Use References?](#why-use-references)
- [Creating References](#creating-references)
- [Population (Joining Data)](#population-joining-data)
- [Complete Implementation](#complete-implementation)
- [Population Options](#population-options)
- [Nested Population](#nested-population)
- [Best Practices](#best-practices)
- [Common Mistakes](#common-mistakes)

</details>

---

<details>
<summary><strong>What are References?</strong></summary>

**References** in MongoDB allow you to create relationships between collections by storing the `_id` of a document from one collection in another collection.

### SQL vs MongoDB Relationships

#### SQL (Foreign Key)
```sql
-- Users Table
| id | firstName | lastName |
|----|-----------|----------|
| 1  | Vikram    | Hasan    |
| 2  | John      | Doe      |

-- Connection Requests Table
| id | senderId | receiverId | status      |
|----|----------|------------|-------------|
| 1  | 1        | 2          | interested  |

-- JOIN to get sender details
SELECT * FROM connection_requests 
JOIN users ON connection_requests.senderId = users.id;
```

#### MongoDB (Reference)
```javascript
// Users Collection
{
    _id: ObjectId("696f97d50dfe1d8f9e53014b"),
    firstName: "Vikram",
    lastName: "Hasan"
}

// Connection Requests Collection
{
    _id: ObjectId("696fe15d506e4e3bf394ac3b"),
    senderId: ObjectId("696f97d50dfe1d8f9e53014b"),  // Reference to User
    receiverId: ObjectId("696fbcd629d4c7bc38d54e33"),
    status: "interested"
}

// Use .populate() to get sender details (similar to JOIN)
```

### Key Concepts

- **Reference**: Store ObjectId from one collection in another
- **ref**: Tells Mongoose which model to use during population
- **populate()**: Replaces ObjectId with actual document data (like SQL JOIN)

### Without References ❌
```javascript
// Storing entire user object (data duplication)
{
    _id: "696fe15d506e4e3bf394ac3b",
    sender: {
        _id: "696f97d50dfe1d8f9e53014b",
        firstName: "Vikram",
        lastName: "Hasan",
        emailId: "vikram@example.com",
        password: "hashed_password",
        // ... all user fields duplicated
    },
    receiverId: "696fbcd629d4c7bc38d54e33",
    status: "interested"
}

// Problems:
// - Data duplication
// - If user updates profile, need to update everywhere
// - Wastes storage space
```

### With References ✅
```javascript
// Only store user ID (reference)
{
    _id: "696fe15d506e4e3bf394ac3b",
    senderId: "696f97d50dfe1d8f9e53014b",  // Just the ID
    receiverId: "696fbcd629d4c7bc38d54e33",
    status: "interested"
}

// Benefits:
// - No data duplication
// - User updates automatically reflected
// - Saves storage
// - Use .populate() when you need full details
```

</details>

---

<details>
<summary><strong>Why Use References?</strong></summary>

### 1. Avoid Data Duplication
```javascript
// ❌ Bad - Duplicating user data
const connectionRequest = {
    sender: {
        firstName: "Vikram",
        lastName: "Hasan",
        emailId: "vikram@example.com",
        age: 25,
        city: "Hyderabad"
    },
    receiver: {
        firstName: "John",
        lastName: "Doe",
        // ... all fields duplicated
    }
}

// ✅ Good - Reference by ID
const connectionRequest = {
    senderId: "696f97d50dfe1d8f9e53014b",
    receiverId: "696fbcd629d4c7bc38d54e33"
}
```

### 2. Single Source of Truth
```javascript
// User updates their profile
User.findByIdAndUpdate("696f97d50dfe1d8f9e53014b", {
    firstName: "Vikram Updated"
});

// With references: Change automatically reflected everywhere
// Without references: Need to update in multiple collections
```

### 3. Storage Efficiency
```javascript
// User document: ~500 bytes
// Reference (ObjectId): 12 bytes

// 1000 connection requests
// With duplication: 1000 × 500 bytes = 500 KB
// With references: 1000 × 12 bytes = 12 KB
// 42x less storage!
```

### 4. Flexible Data Retrieval
```javascript
// Sometimes you need full user details
ConnectionRequest.find().populate("senderId");

// Sometimes you only need the ID
ConnectionRequest.find();  // Fast, no extra queries
```

</details>

---

<details>
<summary><strong>Creating References</strong></summary>

### Step 1: Define Reference in Schema
```javascript
const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"  // Reference to User model
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"  // Reference to User model
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ["ignored", "interested", "accepted", "rejected"],
            message: `{VALUE} is not supported`
        }
    }
}, {
    timestamps: true
});

const ConnectionRequest = mongoose.model("ConnectionRequest", connectionRequestSchema);
module.exports = ConnectionRequest;
```

### Important Parts

| Part | Description |
|------|-------------|
| `mongoose.Schema.Types.ObjectId` | Data type for storing references |
| `ref: "User"` | Name of the model to reference |
| `required: true` | Make reference mandatory |

### Step 2: Create Documents with References
```javascript
// Create a connection request
const connectionRequest = new ConnectionRequest({
    senderId: "696f97d50dfe1d8f9e53014b",  // User's _id
    receiverId: "696fbcd629d4c7bc38d54e33",  // Another user's _id
    status: "interested"
});

await connectionRequest.save();

// Stored in database as:
{
    _id: ObjectId("696fe15d506e4e3bf394ac3b"),
    senderId: ObjectId("696f97d50dfe1d8f9e53014b"),
    receiverId: ObjectId("696fbcd629d4c7bc38d54e33"),
    status: "interested",
    createdAt: ISODate("2026-01-20T20:11:09.092Z"),
    updatedAt: ISODate("2026-01-20T20:11:09.092Z")
}
```

### Multiple References
```javascript
// Post schema with multiple references
const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }]
});
```

### Reference Validation
```javascript
const connectionRequestSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
        validate: {
            validator: async function(id) {
                const user = await mongoose.model("User").findById(id);
                return !!user;  // Return true if user exists
            },
            message: "Sender does not exist"
        }
    }
});
```

</details>

---

<details>
<summary><strong>Population (Joining Data)</strong></summary>

### What is Population?

**Population** is Mongoose's way of replacing ObjectId references with actual document data (similar to SQL JOINs).

### Basic Population
```javascript
// Without population - only IDs
const requests = await ConnectionRequest.find();
console.log(requests);
/*
[{
    _id: "696fe15d506e4e3bf394ac3b",
    senderId: "696f97d50dfe1d8f9e53014b",  // Just ID
    receiverId: "696fbcd629d4c7bc38d54e33",  // Just ID
    status: "interested"
}]
*/

// With population - full user details
const requests = await ConnectionRequest.find().populate("senderId");
console.log(requests);
/*
[{
    _id: "696fe15d506e4e3bf394ac3b",
    senderId: {  // Full user object
        _id: "696f97d50dfe1d8f9e53014b",
        firstName: "Vikram",
        lastName: "Hasan",
        emailId: "vikram@example.com"
    },
    receiverId: "696fbcd629d4c7bc38d54e33",
    status: "interested"
}]
*/
```

### Populate Syntax
```javascript
// Populate single field
Model.find().populate("fieldName");

// Populate multiple fields
Model.find().populate("field1").populate("field2");

// OR
Model.find().populate(["field1", "field2"]);
```

### Example: Connection Request Route
```javascript
// Get all connection requests with sender details
app.get("/connection/requests", auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find requests and populate sender details
        const requests = await ConnectionRequest.find({
            receiverId: userId,
            status: "interested"
        }).populate("senderId");
        
        res.json({
            message: "Connection requests fetched successfully",
            data: requests
        });
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

### Response Format
```json
{
    "message": "Connection requests fetched successfully",
    "data": [
        {
            "_id": "696fe15d506e4e3bf394ac3b",
            "senderId": {
                "_id": "696f97d50dfe1d8f9e53014b",
                "firstName": "Vikram",
                "lastName": "Hasan"
            },
            "receiverId": "696fbcd629d4c7bc38d54e33",
            "status": "interested",
            "createdAt": "2026-01-20T20:11:09.092Z",
            "updatedAt": "2026-01-20T20:11:09.092Z",
            "__v": 0
        }
    ]
}
```

### Populate Both Fields
```javascript
// Populate both sender and receiver
const requests = await ConnectionRequest.find()
    .populate("senderId")
    .populate("receiverId");

// Response
{
    "_id": "696fe15d506e4e3bf394ac3b",
    "senderId": {
        "_id": "696f97d50dfe1d8f9e53014b",
        "firstName": "Vikram",
        "lastName": "Hasan"
    },
    "receiverId": {
        "_id": "696fbcd629d4c7bc38d54e33",
        "firstName": "John",
        "lastName": "Doe"
    },
    "status": "interested"
}
```

### Select Specific Fields
```javascript
// Only get firstName and lastName from sender
const requests = await ConnectionRequest.find()
    .populate("senderId", "firstName lastName");

// Response - only selected fields
{
    "senderId": {
        "_id": "696f97d50dfe1d8f9e53014b",
        "firstName": "Vikram",
        "lastName": "Hasan"
        // No emailId, password, etc.
    }
}
```

### Exclude Fields
```javascript
// Exclude password and __v
const requests = await ConnectionRequest.find()
    .populate("senderId", "-password -__v");
```

### Conditional Population
```javascript
// Only populate if status is "accepted"
const requests = await ConnectionRequest.find()
    .populate({
        path: "senderId",
        match: { status: "accepted" },
        select: "firstName lastName"
    });
```

</details>

---

<details>
<summary><strong>Complete Implementation</strong></summary>

### User Model
```javascript
// models/user.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    emailId: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false  // Don't include in queries by default
    },
    age: Number,
    photoUrl: String,
    about: String
}, {
    timestamps: true
});

const User = mongoose.model("User", userSchema);
module.exports = User;
```

### Connection Request Model
```javascript
// models/connectionRequest.js
const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"  // Reference to User model
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"  // Reference to User model
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ["ignored", "interested", "accepted", "rejected"],
            message: `{VALUE} is not supported`
        }
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
connectionRequestSchema.index({ senderId: 1, receiverId: 1 });

// Pre-save validation
connectionRequestSchema.pre("save", function(next) {
    if (this.senderId.equals(this.receiverId)) {
        return next(new Error("Cannot send connection to yourself"));
    }
    next();
});

const ConnectionRequest = mongoose.model("ConnectionRequest", connectionRequestSchema);
module.exports = ConnectionRequest;
```

### Routes with Population
```javascript
// routes/connection.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ConnectionRequest = require("../models/connectionRequest");

// Send connection request
router.post("/send/:receiverId", auth, async (req, res) => {
    try {
        const senderId = req.user._id;
        const receiverId = req.params.receiverId;
        
        // Check if request already exists
        const existingRequest = await ConnectionRequest.findOne({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        });
        
        if (existingRequest) {
            throw new Error("Connection request already exists");
        }
        
        // Create new request
        const connectionRequest = new ConnectionRequest({
            senderId,
            receiverId,
            status: "interested"
        });
        
        await connectionRequest.save();
        
        // Populate sender details before sending response
        await connectionRequest.populate("senderId", "firstName lastName photoUrl");
        
        res.status(201).json({
            message: "Connection request sent successfully",
            data: connectionRequest
        });
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get received connection requests
router.get("/requests", auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find requests where user is receiver
        const requests = await ConnectionRequest.find({
            receiverId: userId,
            status: "interested"
        })
        .populate("senderId", "firstName lastName age photoUrl about")
        .sort({ createdAt: -1 });
        
        res.json({
            message: "Connection requests fetched successfully",
            data: requests
        });
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get sent connection requests
router.get("/sent", auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find requests where user is sender
        const requests = await ConnectionRequest.find({
            senderId: userId
        })
        .populate("receiverId", "firstName lastName photoUrl")
        .sort({ createdAt: -1 });
        
        res.json({
            message: "Sent requests fetched successfully",
            data: requests
        });
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all connections (accepted requests)
router.get("/connections", auth, async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find accepted connections
        const connections = await ConnectionRequest.find({
            $or: [
                { senderId: userId, status: "accepted" },
                { receiverId: userId, status: "accepted" }
            ]
        })
        .populate("senderId", "firstName lastName photoUrl")
        .populate("receiverId", "firstName lastName photoUrl");
        
        // Extract the other user from each connection
        const connectionList = connections.map(conn => {
            if (conn.senderId._id.toString() === userId.toString()) {
                return conn.receiverId;
            } else {
                return conn.senderId;
            }
        });
        
        res.json({
            message: "Connections fetched successfully",
            data: connectionList
        });
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Accept/Reject connection request
router.patch("/review/:requestId/:status", auth, async (req, res) => {
    try {
        const userId = req.user._id;
        const { requestId, status } = req.params;
        
        // Validate status
        if (!["accepted", "rejected"].includes(status)) {
            throw new Error("Invalid status");
        }
        
        // Find request where user is receiver
        const request = await ConnectionRequest.findOne({
            _id: requestId,
            receiverId: userId,
            status: "interested"
        });
        
        if (!request) {
            throw new Error("Connection request not found");
        }
        
        // Update status
        request.status = status;
        await request.save();
        
        // Populate sender details
        await request.populate("senderId", "firstName lastName photoUrl");
        
        res.json({
            message: `Connection request ${status}`,
            data: request
        });
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
```

### App Setup
```javascript
// app.js
const express = require("express");
const cookieParser = require("cookie-parser");
const connectionRoutes = require("./routes/connection");
const authRoutes = require("./routes/auth");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/connection", connectionRoutes);

module.exports = app;
```

</details>

---

<details>
<summary><strong>Population Options</strong></summary>

### Basic Options
```javascript
Model.find().populate({
    path: "fieldName",      // Field to populate
    select: "field1 field2", // Fields to include
    match: { condition },    // Filter populated docs
    options: { limit: 10 }   // Query options
});
```

### Select Specific Fields
```javascript
// Include only firstName and lastName
ConnectionRequest.find()
    .populate("senderId", "firstName lastName");

// Exclude password and __v
ConnectionRequest.find()
    .populate("senderId", "-password -__v");
```

### Match Conditions
```javascript
// Only populate users over 25
ConnectionRequest.find()
    .populate({
        path: "senderId",
        match: { age: { $gte: 25 } }
    });
```

### Sort Populated Documents
```javascript
// Sort users by firstName
ConnectionRequest.find()
    .populate({
        path: "senderId",
        options: { sort: { firstName: 1 } }
    });
```

### Limit Populated Documents
```javascript
// Only populate first 10 comments
Post.find()
    .populate({
        path: "comments",
        options: { limit: 10 }
    });
```

### Multiple Populate
```javascript
// Populate multiple fields with different options
ConnectionRequest.find()
    .populate({
        path: "senderId",
        select: "firstName lastName photoUrl"
    })
    .populate({
        path: "receiverId",
        select: "firstName lastName",
        match: { age: { $gte: 18 } }
    });
```

### Populate with Conditions
```javascript
// Only populate if certain condition is met
const requests = await ConnectionRequest.find()
    .populate({
        path: "senderId",
        select: "firstName lastName photoUrl about",
        match: { isActive: true },  // Only populate active users
        options: {
            sort: { firstName: 1 },
            limit: 50
        }
    });
```

</details>

---

<details>
<summary><strong>Nested Population</strong></summary>

### What is Nested Population?

Populating references within populated documents (multi-level population).

### Example Schema Structure
```javascript
// User Model
const userSchema = new mongoose.Schema({
    firstName: String,
    city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City"
    }
});

// City Model
const citySchema = new mongoose.Schema({
    name: String,
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Country"
    }
});

// Country Model
const countrySchema = new mongoose.Schema({
    name: String,
    code: String
});

// Connection Request Model
const connectionRequestSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
});
```

### Single Level Population
```javascript
// Populate user
const requests = await ConnectionRequest.find()
    .populate("senderId");

// Result
{
    senderId: {
        _id: "123",
        firstName: "Vikram",
        city: "456"  // Just city ID
    }
}
```

### Nested Population (Two Levels)
```javascript
// Populate user and their city
const requests = await ConnectionRequest.find()
    .populate({
        path: "senderId",
        populate: {
            path: "city"
        }
    });

// Result
{
    senderId: {
        _id: "123",
        firstName: "Vikram",
        city: {
            _id: "456",
            name: "Hyderabad",
            country: "789"  // Just country ID
        }
    }
}
```

### Nested Population (Three Levels)
```javascript
// Populate user, city, and country
const requests = await ConnectionRequest.find()
    .populate({
        path: "senderId",
        populate: {
            path: "city",
            populate: {
                path: "country"
            }
        }
    });

// Result
{
    senderId: {
        _id: "123",
        firstName: "Vikram",
        city: {
            _id: "456",
            name: "Hyderabad",
            country: {
                _id: "789",
                name: "India",
                code: "IN"
            }
        }
    }
}
```

### Multiple Nested Populations
```javascript
// Post with author and comments (each comment has author)
const posts = await Post.find()
    .populate({
        path: "author",
        select: "firstName lastName"
    })
    .populate({
        path: "comments",
        populate: {
            path: "author",
            select: "firstName lastName photoUrl"
        }
    });

// Result
{
    title: "My Post",
    author: {
        firstName: "Vikram",
        lastName: "Hasan"
    },
    comments: [
        {
            text: "Great post!",
            author: {
                firstName: "John",
                lastName: "Doe",
                photoUrl: "url"
            }
        }
    ]
}
```

### Performance Warning ⚠️
```javascript
// ❌ Bad - Too many nested populations (slow)
Model.find()
    .populate({
        path: "level1",
        populate: {
            path: "level2",
            populate: {
                path: "level3",
                populate: {
                    path: "level4"  // Very slow!
                }
            }
        }
    });

// ✅ Good - Limit nesting depth
Model.find()
    .populate({
        path: "level1",
        populate: {
            path: "level2"  // Max 2-3 levels
        }
    });
```

</details>

---

<details>
<summary><strong>Best Practices</strong></summary>

### 1. Always Use `ref` in Schema
```javascript
// ✅ Good - ref defined
senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
}

// ❌ Bad - no ref (populate won't work)
senderId: {
    type: mongoose.Schema.Types.ObjectId
}
```

### 2. Select Only Needed Fields
```javascript
// ❌ Bad - populating everything (including password)
ConnectionRequest.find().populate("senderId");

// ✅ Good - select only needed fields
ConnectionRequest.find()
    .populate("senderId", "firstName lastName photoUrl");
```

### 3. Use Indexes on Reference Fields
```javascript
// ✅ Good - index for faster lookups
connectionRequestSchema.index({ senderId: 1, receiverId: 1 });

// Queries become faster
ConnectionRequest.find({ senderId: userId });
```

### 4. Populate Selectively
```javascript
// ❌ Bad - always populating (even when not needed)
app.get("/requests/count", async (req, res) => {
    const count = await ConnectionRequest.countDocuments()
        .populate("senderId");  // Unnecessary!
});

// ✅ Good - only populate when needed
app.get("/requests", async (req, res) => {
    const requests = await ConnectionRequest.find()
        .populate("senderId", "firstName lastName");
});
```

### 5. Avoid Deep Nesting
```javascript
// ❌ Bad - too deep (slow)
Model.find()
    .populate({
        path: "field1",
        populate: {
            path: "field2",
            populate: {
                path: "field3"  // 3+ levels = slow
            }
        }
    });

// ✅ Good - max 2 levels
Model.find()
    .populate({
        path: "field1",
        populate: "field2"
    });
```

### 6. Handle Missing References
```javascript
// User might be deleted but reference exists
const requests = await ConnectionRequest.find()
    .populate("senderId");

// Filter out requests with deleted users
const validRequests = requests.filter(req => req.senderId);

res.json({ data: validRequests });
```

### 7. Use Lean for Read-Only Data
```javascript
// ✅ Faster queries with .lean()
const requests = await ConnectionRequest.find()
    .populate("senderId", "firstName lastName")
    .lean();  // Returns plain JavaScript objects (faster)
```

### 8. Cache Populated Results
```javascript
// For frequently accessed data
const cachedConnections = {};

async function getConnections(userId) {
    if (cachedConnections[userId]) {
        return cachedConnections[userId];
    }
    
    const connections = await ConnectionRequest.find({ userId })
        .populate("senderId");
    
    cachedConnections[userId] = connections;
    return connections;
}
```

</details>

---

<details>
<summary><strong>Common Mistakes</strong></summary>

### Mistake 1: Forgetting `ref` in Schema
```javascript
// ❌ Wrong - no ref
senderId: {
    type: mongoose.Schema.Types.ObjectId
}

ConnectionRequest.find().populate("senderId");  // Won't work!

// ✅ Correct
senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
}
```

### Mistake 2: Wrong Model Name in `ref`
```javascript
// ❌ Wrong - typo in model name
senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users"  // Model is "User", not "Users"
}

// ✅ Correct
ref: "User"  // Exact model name
```

### Mistake 3: Populating Non-Existent Field
```javascript
// ❌ Wrong - field doesn't exist in schema
ConnectionRequest.find().populate("sender");  // Field is "senderId"

// ✅ Correct
ConnectionRequest.find().populate("senderId");
```

### Mistake 4: Not Handling Deleted References
```javascript
// ❌ Bad - crashes if user is deleted
const request = await ConnectionRequest.findById(id)
    .populate("senderId");

res.json({ sender: request.senderId.firstName });  // Error if senderId is null

// ✅ Good - handle missing references
const request = await ConnectionRequest.findById(id)
    .populate("senderId");

if (!request.senderId) {
    return res.status(404).send("Sender not found");
}

res.json({ sender: request.senderId.firstName });
```

### Mistake 5: Over-Populating
```javascript
// ❌ Bad - populating everything unnecessarily
const requests = await ConnectionRequest.find()
    .populate("senderId")  // All fields
    .populate("receiverId");  // All fields

// ✅ Good - selective population
const requests = await ConnectionRequest.find()
    .populate("senderId", "firstName lastName photoUrl")
    .populate("receiverId", "firstName lastName");
```

### Mistake 6: Populating in Loops
```javascript
// ❌ Very Bad - N+1 query problem
const requests = await ConnectionRequest.find();

for (let request of requests) {
    request.senderId = await User.findById(request.senderId);  // Separate query each time!
}

// ✅ Good - single query with populate
const requests = await ConnectionRequest.find()
    .populate("senderId");
```

### Mistake 7: Not Using Indexes
```javascript
// ❌ Bad - no index on reference fields
// Query: ConnectionRequest.find({ senderId: userId })
// Slow on large collections

// ✅ Good - add index
connectionRequestSchema.index({ senderId: 1 });
```

</details>

---

## Quick Reference

### Define Reference
```javascript
fieldName: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ModelName",
    required: true
}
```

### Basic Population
```javascript
Model.find().populate("fieldName");
```

### Select Fields
```javascript
Model.find().populate("fieldName", "field1 field2");
```

### Multiple Fields
```javascript
Model.find()
    .populate("field1")
    .populate("field2");
```
