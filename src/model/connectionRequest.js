const mongoose = require("mongoose");

const connectionRequestSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
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


const ConnectionRequest= mongoose.model("ConnectionRequest", connectionRequestSchema)
module.exports = ConnectionRequest;


//ConnecitonRequest.find({senderId: 332432423432423423423})
connectionRequestSchema.index({senderId: 1, receiverId: 1}); //compound index

connectionRequestSchema.pre("save", function (req,res) {
    const connectionRequest = this;
    //check if sender user Id is same as receievr userId
    if(connectionRequest.senderId.equals(connectionRequest.receiverId)){
        throw new Error("Cannot send connection to yourself");
    }
    next();
})

//schema pre is kind of a middleware
//it will be called before a connectionrequest is saved



//id of sender and receiver
//you create Enum at a place where you want to restrict user for the values

