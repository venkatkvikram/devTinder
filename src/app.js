const express = require("express")
const connectDB = require("./config/database")
const app = express();
const cookieParser = require("cookie-parser");


app.use(express.json()) //middleware
app.use(cookieParser())
//reads the JSON object and converts the JSON object to Javascript


const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile")
const requestRouter = require("./routes/requests")

app.use("/", authRouter)
app.use("/", profileRouter)
app.use("/", requestRouter)


connectDB()
    .then(() => {
        console.log("Database connection established!");
        app.listen(8888, () => {
            console.log("Server is successfully running in port 8888");
        })
    })
    .catch(err => console.error("Error connecting database"));


//start your server only after you connect to database



