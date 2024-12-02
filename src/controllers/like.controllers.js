import mongoose, { isValidObjectId } from "mongoose";
import Like from "../models/like.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!videoId || !isValidObjectId(videoId)) {
    throw new apiError(401, "invalid videoId");
  }
  const liked = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });
  if (!liked) {
    const likeVideo = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    res.status(200).json(new apiResponse(200, likeVideo, "Video liked"));
  } else {
    const unlikeVideo = await Like.deleteOne({
      video: videoId,
      likedBy: req.user._id,
    });
    res.status(200).json(new apiResponse(200, unlikeVideo, "video unliked"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!commentId || !isValidObjectId(commentId)) {
    throw new apiError(401, "invalid commentId");
  }
  const liked = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });
  if (!liked) {
    const likeComment = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    res.status(200).json(new apiResponse(200, likeComment, "Comment liked"));
  } else {
    const unlikeComment = await Like.deleteOne({
      comment: commentId,
      likedBy: req.user._id,
    });
    res
      .status(200)
      .json(new apiResponse(200, unlikeComment, "Comment unliked"));
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new apiError(401, "invalid tweetId");
  }
  const liked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });
  if (!liked) {
    const likeTweet = await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    res.status(200).json(new apiResponse(200, likeTweet, "Tweet liked"));
  } else {
    const unlikeTweet = await Like.deleteOne({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    res.status(200).json(new apiResponse(200, unlikeTweet, "Tweet unliked"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedVideos = await Like.aggregate([
    {
      $match: {
        video: { $ne: null },
        likedBy: req.user._id,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
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
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: {
          $first: "$video",
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: "$video", // Promote the video content to the root level
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  if (!likedVideos.length) {
    throw new apiError(404, "no liked videos");
  }
  res
    .status(200)
    .json(
      new apiResponse(200, likedVideos, "fetched liked videos successfully")
    );
});

const getLikedComments = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedComments = await Like.aggregate([
    {
      $match: {
        comment: { $ne: null },
        likedBy: req.user._id,
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "comment",
        foreignField: "_id",
        as: "comment",
        pipeline: [
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
            $lookup: {
              from: "videos",
              localField: "video",
              foreignField: "_id",
              as: "commentOn",
              pipeline: [
                {
                  $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "creator",
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
                    creator: {
                      $first: "$creator",
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
                    creator: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              commentOn: {
                $first: "$commentOn",
              },
            },
          },
          {
            $project: {
              _id: 0,
              commentOn: 1,
              createdBy: 1,
              content: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        comment: {
          $first: "$comment",
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: "$comment", // Promote the video content to the root level
      },
    }
  ]);

  if (!likedComments.length) {
    throw new apiError(404, "no liked comments");
  }
  res
    .status(200)
    .json(
      new apiResponse(200, likedComments, "fetched liked comments successfully")
    );
});

const getLikedTweets = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedTweets = await Like.aggregate([
    {
      $match: {
        tweet: { $ne: null },
        likedBy: req.user._id,
      },
    },
    {
      $lookup: {
        from: "tweets",
        localField: "tweet",
        foreignField: "_id",
        as: "tweet",
        pipeline: [
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
              createdBy: 1,
              content: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        tweet: {
          $first: "$tweet",
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: "$tweet", // Promote the video content to the root level
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
  ]);

  if (!likedTweets.length) {
    throw new apiError(404, "no liked tweets");
  }
  res
    .status(200)
    .json(
      new apiResponse(200, likedTweets, "fetched liked tweets successfully")
    );
});
export {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
  getLikedTweets,
  getLikedComments,
};
