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