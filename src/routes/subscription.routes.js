import { Router } from "express";
import verifyJWT from "../middlewares/auth.middlewares.js";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controllers.js";

const subscriptionRouter = Router();
subscriptionRouter.use(verifyJWT);
subscriptionRouter.route("/:channelId").post(toggleSubscription);
subscriptionRouter
  .route("/subscribers/:channelId")
  .get(getUserChannelSubscribers);
subscriptionRouter.route("/channels/:subscriberId").get(getSubscribedChannels);
export default subscriptionRouter;
