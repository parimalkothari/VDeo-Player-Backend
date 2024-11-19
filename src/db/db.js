import mongoose, { connect } from "mongoose"
import {DB_NAME} from "../constants.js"

export const DBConnection=async()=>{
    try {
        const ConnectionInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`Connected to Database !! HOST: ${ConnectionInstance.connection.host}` )
    } catch (error) {
        console.error("DB Connection Failed !!", error)
        process.exit(1)
    }
}