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

const validateEditProfileData = (req) => {
    const allowedFields = [
        "firstName", "lastName", "age", "about", "photoUrl", "skills"
    ]
    console.log(req.body)
    const isEditAllowed = Object.keys(req.body).every(field => allowedFields.includes(field))
    console.log("isEditAllowed", isEditAllowed)
    return isEditAllowed;
}

module.exports = { validateSignUpData , validateEditProfileData}