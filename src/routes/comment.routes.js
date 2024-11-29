import { Router } from "express";
import { addComment, deleteComment, getVideoComments, updateComment } from "../controllers/comment.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";

const commentRouter=Router()
commentRouter.use(verifyJWT)

commentRouter.route('/:videoId').post(addComment).get(getVideoComments)
commentRouter.route('/c/:commentId').patch(updateComment).delete(deleteComment)

export default commentRouter