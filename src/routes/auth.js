const express = require('express')
const bcrypt = require("bcrypt")
const validator = require("validator")
const { validateSignUpData } = require("../utils/validation");
const User = require('../model/user');



const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {

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

authRouter.post("/login", async (req, res) => {
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
            res.cookie("token", token, {
                expires: new Date(Date.now() + 8 * 3600000),
                httpOnly: true,
            })
            //Add the token to cookie and send the response back to user
            res.status(200).send({
                message: "Login Success",
                data: User
            })
        } else {
            throw new Error("Invalid Credentials!")
        }
    } catch (error) {
        res.status(400).send("ERROR: " + error.message)
    }
})


authRouter.post("/logout", async (req, res) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        sameSite: "lax"
    })
        .send("Logged out!")
})

module.exports = authRouter;