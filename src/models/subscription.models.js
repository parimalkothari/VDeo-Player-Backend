import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler";

const subscriptionSchema=new mongoose.Schema({
    subscriber:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

export const Subscription=new mongoose.model('Subscription',subscriptionSchema)