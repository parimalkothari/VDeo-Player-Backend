import { Router } from "express"
import verifyJWT from "../middlewares/auth.middlewares.js"
import { getChannelVideos } from "../controllers/dashboard.controllers.js"

const dashboardRouter=Router()
dashboardRouter.use(verifyJWT)


dashboardRouter.route('/:userId').get(getChannelVideos)

export default dashboardRouter