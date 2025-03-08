import { Schema } from "mongoose";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase: true,
        trim: true,
        index: true
    },
    password : {
        type : String,
        required : [true,"password is required"]
       
    },

    email : {
        type : String,
        required : true,
        unique : true
       
    },
    fullname : {
        type : String,
        required : true,
        trim: true,
        index: true,
        
    },
    avatar : {
        type : String, //cloudinary
        required : true,
        
    },
    coverImage : {
        type : String,//cloudinary
        
    },
    watchHistory:{
        type: Schema.Types.ObjectId,
        ref: "Video"
    },
    refreshToken: {
        type: String
    }

},{timestamps : true });


const User = mongoose.model("User",userSchema);
export {User};