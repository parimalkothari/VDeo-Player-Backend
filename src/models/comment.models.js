import mongoose from "mongoose";

const commentSchema=new mongoose.Schema({
    content:{
        type: String,
        required:true
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    video:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Video"
    }
},{timestamps:true})

const Comment= new mongoose.model('Comment',commentSchema)
export default Comment