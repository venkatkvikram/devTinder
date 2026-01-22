
const express = require("express");
const { userAuth } = require("../middlewares/auth");
const ConnectionRequest = require("../model/connectionRequest");
const User = require("../model/user");
const userRouter = express.Router();

const USER_SAFE_DATA = "firstName lastName age gender photoUrl"

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
            if (row.senderId._id.toString() === loggedInUser._id.toString()) {
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

userRouter.get("/user/feed", userAuth, async (req, res) => {
    try {
        const loggedInUser = req.user;
        const page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit)
        limit = limit > 50 ? 10 : limitl
        const skip = (page - 1) * limit;
        //User should se all the user cards except
        //0. His own card
        //1. His connections
        //2. Ignored people
        //3. Already sent the connection requrst
        //find all connectionRequests (send + receievd)
        const myConnectionRequests = await ConnectionRequest.find({
            $or: [
                { senderId: loggedInUser._id }, { receiverId: loggedInUser._id }
            ]
        }).select("senderId receiverId")
        const hideUsersFromFeed = new Set();
        myConnectionRequests.forEach(req => {
            hideUsersFromFeed.add(req.senderId.toString())
            hideUsersFromFeed.add(req.receiverId.toString())
        })
        const users = await User.find({
            $and: [
                { _id: { $nin: Array.from(hideUsersFromFeed) } }, //nin : Not in 
                { _id: { $ne: loggedInUser._id } } //ne : Not equal
            ]
        }).select(USER_SAFE_DATA).skip(skip).limit(limit)
        res.send(users)
    } catch (error) {
        res.status(400).json({
            message: `ERROR : ${error.message}`
        })
    }
})

module.exports = userRouter;