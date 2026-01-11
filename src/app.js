const express = require("express")
const connectDB = require("./config/database")
const app = express();
const User = require("./model/user")


app.use(express.json()) //middleware
//reads the JSON object and converts the JSON object to Javascript

app.post("/signup", async (req, res) => {
    const user = new User(req.body);
    try {
        await user.save(); //returns a promise 
        res.send("User Added successfully");
    } catch (error) {
        res.status(400).send("Error Saving the user" + error.message)
    }
})

//GET user by email
app.get("/user", async (req, res) => {
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

//feed API - GET /feed
app.get("/feed", async (req, res) => {
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



