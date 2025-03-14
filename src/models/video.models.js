import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema({
    videoFile:{
       type:String,//cloudinary
       required: true,

    },
    thumbnail:{
        type:String,//cloudinary
        required: true,
 
    },
    title:{
        type:String,
        required: true,
 
    },
    description:{
        type:String,
        required: true,
 
    },
    duration:{
        type:Number,//cloudinary
        required: true,
 
    },
    views:{
        type:String,//cloudinary
        default:0,
 
    },
    isPublished:{
        type:Boolean,//cloudinary
        default: true,
 
    },
    owner:{
       type: Schema.Types.ObjectId,
       ref:"User",
       required: true,
 
    },

},{timestamps:true});

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video",videoSchema);