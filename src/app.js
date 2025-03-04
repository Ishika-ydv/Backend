import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


const app = express();

app.cors({
    origin: process.env.CORS_ORIGIN,
    credential: true
}) 

app.use(express.json({limit: "16kb"}));
app.use(express.urlencoded({extented:true,limit: "16kb"}));
app.use(express.static("public"));
app.use(cookieParser());
export {app};