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