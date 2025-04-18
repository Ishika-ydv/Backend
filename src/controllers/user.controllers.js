import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.models.js";
import {ApiError} from "../utils/ApiError.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) =>{
    try{
          const user = await User.findById(userId); //await ka dhyan rkhna
          const accessToken = user.generateAccessToken();
          const refreshToken = user.generateRefreshToken();
          user.refreshToken = refreshToken;
          await user.save({validateBeforeSave : false});

          return {accessToken, refreshToken};
          
    }catch(err){
        throw new ApiError(500, "something went wrong while generating access and refresh tokens", err);

    }
}

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


const loginUser = asyncHandler(async (req,res) =>{
    //req body -> data
    //username or email
    //find the user
    //check password
    //access and refresh token
    //send secure cookies
    const {email, username, password} = req.body;

    if(!username && !email){
        throw new ApiError(400,"Email or Username is required!!")
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User not exists");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials");
    }
    
    // console.log(user.username);
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accesstoken" , accessToken, options)
    .cookie("refreshToken" , refreshToken , options)
    .json(
        new ApiResponse(
           200,
           {
            user:loggedInUser, accessToken, refreshToken
           }, 
           "User logged in Successfully"
        )
    )






});

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accesstoken", options)
    .clearCookie("refreshToken", options)
    .json( 
    new ApiResponse(200,{}, "User successfully logged Out")
    )
});

const refreshAccessToken = asyncHandler( async (req,res) => {
    const incomingRefreshAccessToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshAccessToken){
        throw new ApiError(401, "unauthorized request");
    }

   try {
     const decodedToken = jwt.verify(
         incomingRefreshAccessToken,
         process.env.REFRESH_TOKEN_SECRET
     );
 
 
     const user = await User.findById(decodedToken?._id);
     if(!user){
         throw new ApiError(401, "Invalid Refresh Token");
     }
 
     if( incomingRefreshAccessToken !== user?.refreshToken){
         throw new ApiError(401, "Refresh token is expired or used");
     }
 
     const options = {
         httpOnly: true,
         secure: true
     }
 
     const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id);
 
     return res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", newrefreshToken, options)
     .json(
         new ApiResponse(
             200,
             {accessToken, refreshToken : newrefreshToken},
             "Access Token Refreshed"
         )
     )
 
   } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    
   }

});


const changeCurrentPassword = asyncHandler( async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Invalid Password");

    }


    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password Changed Successfully")
    )

});

const getCurrentuser = asyncHandler( async (req, res) => {
     return res 
     .status(200)
     .json(200, req.user, "current user fetched Successfully")
});

//if you want to update file try to have a seperate controller to ease the process if you dont have to update the text data at the same time


const updateAccountDetails = asyncHandler( async (req, res) =>{
    const {fullName , email} = req.body;

    if(!fullName || !email) {
        throw new ApiError(400 , "All fields are required");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        { 
            $set:{
                fullName,
                email
            }
        },
        {new: true}
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));

});

//needed two middelware 1) multer to accept file 2) user showed be logged in

const updateUserAvatar = asyncHandler( async (req, res) =>{
    // accepting single file (file) not files
    const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath){
        throw new ApiError( 400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading the avatar file");

    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password");

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Avatar updated successfully"));

});


const updateUserCoverImage = asyncHandler( async (req, res) =>{
    // accepting single file (file) not files
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError( 400, "Cover image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading the cover image file");

    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password");

    return res
    .status(200)
    .json( new ApiResponse(200, user, "Cover Image updated successfully"));

});



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentuser,
    changeCurrentPassword,
    updateAccountDetails,
    updateUserCoverImage,
    updateUserAvatar
};