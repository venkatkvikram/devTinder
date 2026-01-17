const express = require("express");
const { userAuth } = require("../middlewares/auth");
const requestRouter = express.Router();


requestRouter.post("/sendConnectionRequest", userAuth, async (req, res) => {
    const user = req.user;
    console.log("Connection Request sent!")
    res.send(user.firstName + " sent the Connection Request!")
})


module.exports = requestRouter;