const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref:"User" //reference to user collection
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref:"User" //reference to user collection
    },
    status: {
        type: String,
        required: true,
        enum: {
            values: ["ignored", "interested", "accepted", "rejected"],
            message: `{VALUE} is not supported`
        }
    },

}, {
    timestamps: true
})

//compound index - must be defined before model creation
connectionRequestSchema.index({senderId: 1, receiverId: 1});

//pre save middleware - must be defined before model creation
connectionRequestSchema.pre("save", async function () {
    const connectionRequest = this;
    //check if sender user Id is same as receiver userId
    if(connectionRequest.senderId.equals(connectionRequest.receiverId)){
        throw new Error("Cannot send connection to yourself");
    }
})

const ConnectionRequest = mongoose.model("ConnectionRequest", connectionRequestSchema)
module.exports = ConnectionRequest;

//schema pre is kind of a middleware
//it will be called before a connectionrequest is saved



//id of sender and receiver
//you create Enum at a place where you want to restrict user for the values

