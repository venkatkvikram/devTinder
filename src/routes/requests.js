const express = require("express");
const { userAuth } = require("../middlewares/auth");
const requestRouter = express.Router();
const ConnectionRequest = require("../model/connectionRequest");
const User = require("../model/user");


requestRouter.post("/request/send/:status/:receiverId", userAuth, async (req, res) => {
    try {
        console.log("1. Route handler started");
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
        console.log("2. About to save connection request");
        const data = await connectionRequest.save();
        console.log("3. Connection Request saved!")
        res.json({
            message: `${req.user.firstName} is ${status} in ${receiver.firstName}`,
            data
        })
    } catch (error) {
        res.status(400).send(`ERROR : ${error.message}`)
    }
})


requestRouter.post("/request/review/:status/:requestId", userAuth, async (req, res) => {
    try {
        const { status, requestId } = req.params;
        const loggedInUser = req.user;
        console.log("loggedInUser" ,loggedInUser)
        const allowedStatus = ["accepted", "rejected"];
        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid Status"
            })
        }
        const connectionRequest = await ConnectionRequest.findOne({
            _id: requestId,
            receiverId: loggedInUser?._id,
            status: "interested"
        })
        if (!connectionRequest) {
            return res.status(400).json({
                message: `Connection Request doesn't exists.`
            })
        }
        connectionRequest.status = status;
        const data = await connectionRequest.save();
        return res.status(200).json({
            message: `Connection Request ${status}`,
            data
        })
    } catch (error) {
        return res.status(400).json({
            message: `ERROR: ${error.message}`
        })
    }
})





module.exports = requestRouter;