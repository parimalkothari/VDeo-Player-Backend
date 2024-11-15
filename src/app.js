import express, { urlencoded } from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
const app=express()

app.use(cors({
    origin: process.env.CORS_ORIGIN
}))

app.use(urlencoded({extended:true}))
app.use(express.json({limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

export default app