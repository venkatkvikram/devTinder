const express = require("express")
const connectDB = require("./config/database")
const app = express();
const User = require("./model/user")

app.post("/signup", async (req, res) => {
    const userObj = {
        firstName: "Ram",
        lastName: "Kambham",
        emailId: "ram.kam@gmail.com",
        password: "ram123"
    }
    //creating a new instance of UserModel
    const user = new User(userObj);
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



