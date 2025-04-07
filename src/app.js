 const express = require("express")


 const app = express();


app.use((req,res) => {
    res.send("Helo")
})


 app.listen(3000, () => {
    console.log("Listening on 3000...")
 })