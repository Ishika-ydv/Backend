import dotenv from "dotenv"



import { DB_NAME } from "./constants.js";

import connectDB from "./db/index.js";
dotenv.config({
    path:'./env'
})

connectDB()
.then(() =>{
    app.listen(process.env.PORT || 8000, () =>{
        console.log("server is running on port",process.env.PORT);
    })
})
.catch((err) =>{
    console.log("Error:" ,err);
})