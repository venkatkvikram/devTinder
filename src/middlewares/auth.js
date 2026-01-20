const User = require("../model/user");
const jwt = require("jsonwebtoken")


const adminAuth = (req, res, next) => {
    const token = "abcd1234"; //dummy token
    if (req.query.token === token) {
        next(); //proceed to next route handler
    } else {
        res.status(403).send("Forbidden: Invalid token");
    }
};

const userAuth = async (req, res, next) => {
    //Read the token from req cookies
    try {
        const { token } = req.cookies;
        if(!token) {
            throw new Error("Invalid Token")
        }
        const decodedToken = await jwt.verify(token, "VIKRAM@^*@#");

        const { _id } = decodedToken;
        //validate the token
        const user = await User.findById(_id);
        if (!user) {
            throw new Error("User Not Found!")
        }
        req.user = user;
        console.log("0. Auth middleware passed, calling next()");
        next(); //go to next handler
    } catch (err) {
        res.status(400).send("Error: " + err.message)
    }
}

module.exports = { adminAuth, userAuth };