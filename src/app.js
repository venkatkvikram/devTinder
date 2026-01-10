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
        res.status(400).send("Error Saving the user" + err.message)
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



