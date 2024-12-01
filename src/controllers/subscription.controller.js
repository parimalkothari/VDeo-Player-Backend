import mongoose, { isValidObjectId } from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import Subscription from "../models/subscription.models.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!channelId || !isValidObjectId(channelId)) {
    throw new apiError(401, "Invalid channelId");
  }
  const subscribed = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user._id,
  });

  if (!subscribed) {
    if (channelId === req.user._id.toString()) {
      throw new apiError(403, "Action not allowed");
    }
    const sub = await Subscription.create({
      channel: channelId,
      subscriber: req.user._id,
    });
    res.status(201).json(new apiResponse(201, sub, "channel subscribed"));
  } else {
    const unsub = await Subscription.deleteOne({
      channel: channelId,
      subscriber: req.user._id,
    });
    res.status(200).json(new apiResponse(200, unsub, "channel unsubscribed"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const {
    channelId,
    sortBy = "createdAt",
    sortType = 1,
    pages = 1,
    limit = 3,
  } = req.params;
  const pageInt = parseInt(pages);
  const limitInt = parseInt(limit);
  if (!channelId || !isValidObjectId(channelId)) {
    throw new apiError(401, "Invalid channelId");
  }
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber",
        pipeline: [
          {
            $project: {
              _id: 0,
              avatar: 1,
              fullname: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscriber: {
          $first: "$subscriber",
        },
      },
    },
    {
      $project: {
        _id: 0,
        subscriber: 1,
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
    {
      $skip: (pageInt - 1) * limitInt,
    },
    {
      $limit: limitInt,
    },
  ]);
  if (!subscribers.length) {
    throw new apiError(404, "channel has no subscribers");
  }
  res
    .status(200)
    .json(
      new apiResponse(201, subscribers, "subscribers list fetched successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const {
    subscriberId,
    sortBy = "createdAt",
    sortType = 1,
    pages = 1,
    limit = 3,
  } = req.params;
  const pageInt = parseInt(pages);
  const limitInt = parseInt(limit);
  if (!subscriberId || !isValidObjectId(subscriberId)) {
    throw new apiError(401, "Invalid subscriberId");
  }
  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $project: {
              _id: 0,
              avatar: 1,
              fullname: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        channel: {
          $first: "$channel",
        },
      },
    },
    {
      $project: {
        _id: 0,
        channel: 1,
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
    {
      $skip: (pageInt - 1) * limitInt,
    },
    {
      $limit: limitInt,
    },
  ]);
  if (!channels.length) {
    throw new apiError(404, "No channels found");
  }
  res
    .status(200)
    .json(new apiResponse(201, channels, "channels list fetched successfully"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
