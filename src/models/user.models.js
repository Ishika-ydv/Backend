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

userSchema.pre("save", async function(next){
    if(!this.isModified("password")) return;
    this.password = bcrypt.hash(this.password,10);
    next();
})
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password,this.password)
    
}

userSchema.methods.generateAccessToken = function (){
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
      }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id,
        
    },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
      }
    );
}

const User = mongoose.model("User",userSchema);
export {User};