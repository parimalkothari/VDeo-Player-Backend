import { Router } from "express";
import verifyJWT from '../middlewares/auth.middlewares.js'
import { getLikedComments, getLikedTweets, getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controllers.js";
const likedRouter=Router()
likedRouter.use(verifyJWT)


likedRouter.route('/video/:videoId').post(toggleVideoLike)
likedRouter.route('/comment/:commentId').post(toggleCommentLike)
likedRouter.route('/tweet/:tweetId').post(toggleTweetLike)

likedRouter.route('/getLikedVideos').get(getLikedVideos)
likedRouter.route('/getLikedComments').get(getLikedComments)
likedRouter.route('/getLikedTweets').get(getLikedTweets)

export default likedRouter