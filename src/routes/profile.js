const express = require('express')
const profileRouter = express.Router();
const { userAuth } = require("../middlewares/auth"); //pass this before req handler
const { validateEditProfileData } = require('../utils/validation');
const bcrypt = require("bcrypt")

//GET user by email
profileRouter.get("/user", userAuth, async (req, res) => {
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

profileRouter.get("/profile", userAuth, async (req, res) => {
    try {
        const user = req.user;
        res.status(200).send(user);
    } catch (err) {
        res.status(400).send("Error: " + err.message)
    }
})


//feed API - GET /feed
profileRouter.get("/feed", userAuth, async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).send(users);
    } catch (error) {
        res.status(400).send("Something went wrong!");
    }
})

//delete
profileRouter.delete("/user", async (req, res) => {
    const userId = req.body.userId;
    try {
        const user = await User.findByIdAndDelete(userId);
        res.send("User deleted successfully")
    } catch (error) {
        res.status(400).send("Something went wrong!");
    }
})

//update data of user
profileRouter.patch("/user/:userId", async (req, res) => {
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

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
    try {
        if (!validateEditProfileData(req)) {
            throw new Error("Invalid payload in edit request")
        }
        const loggedInUser = req.user;
        Object.keys(req.body).every(field => loggedInUser[field] = req.body[field])
        await loggedInUser.save(); //save in db
        res.json({
            message: `${loggedInUser.firstName} Profile Updated Successfully`,
            data: loggedInUser
        })
    } catch (error) {
        res.status(400).send("ERROR: " + error.message)
    }
})


profileRouter.patch("/profile/password", userAuth, async (req, res) => {
    try {
        //check existing password is same as req.body.password
        const { password } = req.body;
        const loggedInUser = req.user;
        const isPasswordSame = await bcrypt.compare(password, loggedInUser.password)
        console.log(isPasswordSame);
        if (isPasswordSame) {
            throw new Error("New password should not be the same as old password!")
        }
        console.log("Before", loggedInUser)
        const hashedNewPassword = await bcrypt.hash(password, 10)
        loggedInUser.password = hashedNewPassword;
        console.log("After", loggedInUser)
        await loggedInUser.save();
        res.json({
            message: `Password updated successfully!`,
            data: loggedInUser
        })
    } catch (error) {
        res.status(400).send(`Error: ${error.message}`)
    }
})
module.exports = profileRouter;