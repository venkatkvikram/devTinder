const express = require("express")


const app = express();


const {adminAuth, userAuth} = require("./middlewares/auth");

app.use("/admin", adminAuth); //applies to all HTTP methods starting with /admin

app.post("/user/login", (req,res) => {
    res.send("Success Login!")
})

app.get("/user", userAuth, (req,res) => {
    res.send("User Home Page")
})


app.listen(3000, () => {
    console.log("Listening on 3000...")
})