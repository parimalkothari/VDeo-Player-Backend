import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controllers.js";
import verifyJWT from "../middlewares/auth.middlewares.js";
import upload from "../middlewares/multer.middlewares.js";

const videoRouter = Router();

videoRouter.use(verifyJWT);
videoRouter.route("/add-video").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishAVideo
);

videoRouter
  .route("/v/:videoId")
  .get(getVideoById)
  .patch(
    upload.fields([
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    updateVideo
  )
  .delete(deleteVideo);

  
  videoRouter.route("/t/:videoId").patch(togglePublishStatus);
  videoRouter.route("/search").get(getAllVideos);
export default videoRouter;
