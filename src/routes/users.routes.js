import { Router } from "express";
import {
  getCurrentUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  updateCurrentPassword,
} from "../controllers/user.controllers.js";
import upload from "../middlewares/multer.middlewares.js";
import verifyJWT from "../middlewares/auth.middlewares.js";
const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(verifyJWT, logOutUser);
userRouter.route("/refresh-token").post(verifyJWT, refreshAccessToken);
userRouter.route("/change-password").patch(verifyJWT, updateCurrentPassword);
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);
userRouter.route("/update-account").patch(verifyJWT, updateAccountDetails);
userRouter
  .route("/change-avatar")
  .patch(upload.single("avatar"), verifyJWT, updateAvatar);
userRouter
  .route("/change-coverImage")
  .patch(upload.single("coverImage"), verifyJWT, updateCoverImage);
export default userRouter;
