const express = require("express");
const { userAuth } = require("../middlewares/auth");
const requestRouter = express.Router();
const ConnectionRequest = require("../model/connectionRequest");
const User = require("../model/user");


requestRouter.post("/request/send/:status/:receiverId", userAuth, async (req, res) => {
    try {
        const senderId = req.user._id;
        const receiverId = req.params.receiverId;
        const status = req.params.status;
        const allowedStatus = ["interested", "ignored"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                message: `Invalid Status: ${status}`
            })
        }
        //IF there is a existing connection request
        const existingConnectionRequest = await ConnectionRequest.findOne({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId }
            ]
        })
        //if receoverId exists in DB
        const receiver = await User.findById(receiverId)
        if (!receiver) {
            return res.status(400).json({
                message: `User doesn't exist in database`
            })
        }
        if (existingConnectionRequest) {
            return res.status(400).json({
                message: "Connection Request Already Present",
            })
        }

        const connectionRequest = new ConnectionRequest({
            senderId,
            receiverId,
            status
        })
        const data = await connectionRequest.save();
        res.json({
            message: `${req.user.firstName} is ${status} in ${receiver.firstName}`,
            data
        })
        console.log("Connection Request sent!")
        res.send(user.firstName + " sent the Connection Request!")
    } catch (error) {
        res.status(400).send(`ERROR : ${error.message}`)
    }
})


module.exports = requestRouter;