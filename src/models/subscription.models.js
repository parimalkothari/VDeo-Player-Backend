import mongoose from "mongoose";

const subscriptionSchema=new mongoose.Schema({
    subscriber:{ //One who subscribes
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    channel:{ //One whom subscriber subscribes
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
},{timestamps:true})

const Subscription=new mongoose.model('Subscription',subscriptionSchema)
export default Subscription