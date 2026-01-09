const express = require("express")


const app = express();


// `app.use((req, res) => {
//     res.send("Helo")
// })`

app.use("/user", (req, res, next) => {
    res.send("Response 1!")
    next(); //goes to second route handler
},
    (req, res) => {
        res.send("Response 2 after Response 1"); //code will throw an error when you try to send another response in the same URL route/request
    }
)


app.listen(3000, () => {
    console.log("Listening on 3000...")
})