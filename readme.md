# Express.js Middleware and Error Handlers Guide

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
============

1. First Connect to Database then listen to server


Document (entry) => Collection (table user) => Database (devTinder)