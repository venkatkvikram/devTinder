
const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../model/connectionRequest");
const userRouter = express.Router();

const USER_SAFE_DATA = ["firstName", "lastName", "age", "gender", "photoUrl"]

//pending requests
userRouter.get("/user/requests/received", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;
        const connectionRequests = await ConnectionRequest.find({
            receiverId: loggedInUser._id,
            status: "interested"
        }).populate("senderId", USER_SAFE_DATA)
        res.json({
            message: "Connection requests fetched successfully",
            data: connectionRequests
        })
    } catch (error) {
        res.status(400).json({
            message: `ERROR : ${error?.message}`
        })
    }
})

userRouter.get("/user/requests/connections", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;
        const connectionRequests = await ConnectionRequest.find({
            $or: [
                { receiverId: loggedInUser?._id, status: "accepted" },
                { senderId: loggedInUser?._id, status: "accepted" }
            ],
        }).populate("senderId", USER_SAFE_DATA).populate("receiverId", USER_SAFE_DATA)
        const data = connectionRequests.map((row) => {
            if(row.senderId._id.toString() === loggedInUser._id.toString()) {
                return row.receiverId
            } else {
                return row.senderId
            }
    })
        res.status(200).send({
            data
        })
    } catch (error) {
        res.status(400).send({
            message: `ERROR: ${error?.message}`
        })
    }
})

module.exports = userRouter;