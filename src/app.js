const express = require("express")
const connectDB = require("./config/database")
const app = express();
const User = require("./model/user")
const validator = require("validator")
const { validateSignUpData } = require("./utils/validation")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cookieParser = require("cookie-parser");
const { userAuth } = require("./middlewares/auth"); //pass this before req handler

app.use(express.json()) //middleware
app.use(cookieParser())
//reads the JSON object and converts the JSON object to Javascript

app.post("/signup", async (req, res) => {

    //validation of the data
    //encrypt the password and store the user into the database
    try {
        validateSignUpData(req)
        const { password, firstName, lastName, emailId } = req.body
        const passwordHash = await bcrypt.hash(password, 10)
        console.log(passwordHash)
        const user = new User({
            firstName, lastName, emailId, password: passwordHash
        });
        await user.save(); //returns a promise 
        res.send("User Added successfully");
    } catch (error) {
        res.status(400).send("Error Saving the user: " + error.message)
    }
})

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

//GET user by email
app.get("/user", userAuth, async (req, res) => {
    const userEmail = req.body.emailId;
    try {
        const user = await User.find({ emailId: userEmail });
        if (user.length === 0) {
            res.status(404).send("User Not Found!")
        }
        res.status(200).send(user);
    } catch (error) {
        res.status(400).send("Something went wrong!")
    }
})

app.get("/profile", userAuth, async (req, res) => {
    try {
        const user = req.user;
        res.status(200).send(user);
    } catch (err) {
        res.status(400).send("Error: " + err.message)
    }
})

app.post("/sendConnectionRequest", userAuth, async (req, res) => {
    const user = req.user;
    console.log("Connection Request sent!")
    res.send(user.firstName + " sent the Connection Request!")
})

//feed API - GET /feed
app.get("/feed", userAuth, async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).send(users);
    } catch (error) {
        res.status(400).send("Something went wrong!");
    }
})

//delete
app.delete("/user", async (req, res) => {
    const userId = req.body.userId;
    try {
        const user = await User.findByIdAndDelete(userId);
        res.send("User deleted successfully")
    } catch (error) {
        res.status(400).send("Something went wrong!");
    }
})

//update data of user
app.patch("/user/:userId", async (req, res) => {
    const userId = req.params?.userId
    const data = req.body;

    try {
        const ALLOWED_UPDATES = ["photoUrl", "about", "gender", "age"]
        const isUpdatedAllowed = Object.keys(data).every((key) =>
            ALLOWED_UPDATES.includes(key)
        )
        if (!isUpdatedAllowed) {
            throw new Error("Update not allowed!")
        }
        if (data?.skills.length > 10) {
            throw new Error("Skills cant be more than 10");
        }
        await User.findByIdAndUpdate({ _id: userId }, data, {
            returnDocument: "after",
            runValidators: true
        })
        res.send("User updated successfully!")
    } catch (error) {
        res.status(400).send("Update failed" + error.message);
    }
})


connectDB()
    .then(() => {
        console.log("Database connection established!");
        app.listen(8888, () => {
            console.log("Server is successfully running in port 8888");
        })
    })
    .catch(err => console.error("Error connecting database"));


//start your server only after you connect to database



