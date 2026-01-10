const mongoose = require("mongoose");


const connectDB = async () => {
    await mongoose.connect("mongodb+srv://venkatasai:venkatasai@node-learn.0giuomi.mongodb.net/devTinder")
}

module.exports = connectDB