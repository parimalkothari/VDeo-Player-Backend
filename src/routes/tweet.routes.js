import { Router } from "express";
import verifyJWT from "../middlewares/auth.middlewares.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controllers.js";

const tweetRouter=Router()
tweetRouter.use(verifyJWT)

tweetRouter.route('/').post(createTweet)
tweetRouter.route('/t/:tweetId').patch(updateTweet).delete(deleteTweet)
tweetRouter.route('/u/:userId').get(getUserTweets)

export default tweetRouter