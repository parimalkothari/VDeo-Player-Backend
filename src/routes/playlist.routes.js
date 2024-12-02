import { Router } from "express";
import verifyJWT from "../middlewares/auth.middlewares.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlist.controllers.js";

const playlistRouter = Router();

playlistRouter.use(verifyJWT);

playlistRouter.route("/").post(createPlaylist);
playlistRouter.route("/user/:userId").get(getUserPlaylists);
playlistRouter
  .route("/:playlistId")
  .get(getPlaylistById)
  .delete(deletePlaylist)
  .patch(updatePlaylist);
playlistRouter.route("/add/:videoId/:playlistId").post(addVideoToPlaylist);
playlistRouter
  .route("/remove/:videoId/:playlistId")
  .delete(removeVideoFromPlaylist);

export default playlistRouter;
