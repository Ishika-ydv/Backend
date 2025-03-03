import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () =>{
    try{
        const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`DB Connected ${connectionInstance.connection.host}`);
    }catch(err){
       console.log("connection failed to the database:", err);
    }
}

export default connectDB;