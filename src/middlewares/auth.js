const adminAuth = (req, res, next) => {
    const token = "abcd1234"; //dummy token
    if (req.query.token === token) {
        next(); //proceed to next route handler
    } else {
        res.status(403).send("Forbidden: Invalid token");
    }
};

const userAuth = (req,rest,next) => {
    const token = "user1234"
    if(req.query.token === token){
        next();
    } else {
        res.status(403).send("Forbidden! Invalid token")
    }
}

module.exports = { adminAuth, userAuth };