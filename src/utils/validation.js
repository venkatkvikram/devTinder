const validator = require("validator")

const validateSignUpData = (req) => {
    const { emailId, firstName, lastName, password } = req.body;
    if (!firstName || !lastName) {
        throw new Error("Name is required");
    }
    else if (!validator.isEmail(emailId)) {
        throw new Error("Invalid email")
    } else if (!validator.isStrongPassword(password)) {
        throw new Error("Please enter a strong password")
    }
}

module.exports = {validateSignUpData}