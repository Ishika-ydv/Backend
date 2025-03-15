import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js";
import {ApiError} from "../utils/ApiError.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req,res) =>{                               
   //get user detail from frontend
   //validation- not empty
   //check if user already exists: username,email
   //check for images, check for avatar
   //upload them to cloudinary,avatar
   //create user object - entry in db
   //remove password and refresh token fields from response
   //check for user creation
   //return result

   const {fullName, email, username, password} = req.body;
   console.log("email:", email);

    if(
        [username, email, fullName, password].some((fields) => fields?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )

    if(!existedUser){
        throw new ApiError(409, "User with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
         coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }


    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url  ||  "",
        email,
        password,
        username: username.toLowerCase()
    });

    const CreatedUser = await User.findById(user._id).select(
        "-password -refreshToken" 
    )

    if(!CreatedUser){
        throw new ApiError(500, "Something went wrong whilr registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200,CreatedUser, "User registered successfully")
    )


});

export {registerUser};