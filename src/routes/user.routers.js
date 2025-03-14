import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middlewares.js";
import multer from "multer";
const router = Router();


router.route("/register").post(
    upload.fields([
        {
           name: "avatar",
           maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);



export default router;