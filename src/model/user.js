const mongoose = require("mongoose");
const validator = require("validator")

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minlength: 4,
        maxlength: 15
    },
    lastName: {
        type: String,
    },
    emailId: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate(value) {
            if(!validator.isEmail(value)) {
                throw new Error("Invalid email address!" + value)
            }
        }
    },
    password: {
        type: String,
        required: true,
        validate(value) {
            if(!validator.isStrongPassword(value)) {
                throw new Error("Not a strong password" + value);
            }
        }
    },
    age: {
        type: Number,
        min: 18,
    },
    gender: {
        type: String,
        validate(value) {
            if (!["male", "female", "others"].includes(value)) {
                throw new Error("Invalid gender data")
            }
        }
    },
    photoUrl: {
        type: String,
        defaultValue: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLMI5YxZE03Vnj-s-sth2_JxlPd30Zy7yEGg&s",
        validate(value) {
            if(!validator.isURL(value)) {
                throw new Error("Invalid Photo URL")
            }
        }
    },
    about: {
        type: String,
        defaultValue: "Default description of the User"
    },
    skills: {
        type: [String]
    }
}, {
    timestamps: true
})

const User = mongoose.model("User", userSchema); //Models always should start with capital letter

module.exports = User