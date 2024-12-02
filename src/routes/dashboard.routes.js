import { Router } from "express"
import verifyJWT from "../middlewares/auth.middlewares.js"
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controllers.js"

const dashboardRouter=Router()
dashboardRouter.use(verifyJWT)


dashboardRouter.route('/c/:channelId').get(getChannelVideos)
dashboardRouter.route('/stats').get(getChannelStats)

export default dashboardRouter