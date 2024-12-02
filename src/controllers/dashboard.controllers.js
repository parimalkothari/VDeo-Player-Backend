import mongoose, { isValidObjectId } from "mongoose";
import Video from "../models/video.models.js";
import Like from "../models/like.models.js";
import Subscription from "../models/subscription.models.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const channelId = req.user._id;
  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $count: "subscriberCnt",
    },
  ]);

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  const likes = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoInfo",
      },
    },
    {
      $match: {
        "videoInfo.owner": new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: null,
        totalVideoLikes: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  const result = {
    subscribersCount: subscribers[0].subscriberCnt,
    totalVideos: videos[0].totalVideos,
    totalViews: videos[0].totalViews,
    totalVideoLikes: likes[0].totalVideoLikes,
  };
  res
    .status(200)
    .json(new apiResponse(200, result, "Channel details fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const { channelId } = req.params;
  if (!channelId || !isValidObjectId(channelId)) {
    throw new apiError(401, "Invalid channelId");
  }
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortType = "asc",
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const limitInt = parseInt(limit);
  const pageInt = parseInt(page);
  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
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
        createdBy: {
          $first: "$createdBy",
        },
      },
    },
    {
      $project: {
        _id: 0,
        thumbnail: 1,
        videoFile: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        createdBy: 1,
        isPublished: 1,
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

  if (!videos.length) {
    throw new apiError(500, "No matching results found");
  }
  res
    .status(200)
    .json(new apiResponse(200, videos, "Videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
