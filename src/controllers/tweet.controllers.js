import mongoose, { isValidObjectId } from "mongoose";
import Tweet from "../models/tweet.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import Like from "../models/like.models.js";
import User from "../models/user.models.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!content || !content.trim()) {
    throw new apiError(401, "tweet cannot be empty");
  }
  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });
  if (!tweet) {
    throw new apiError(500, "something went wrong");
  }
  res.status(201).json(new apiResponse(201, tweet, "tweet added successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!userId || !isValidObjectId(userId)) {
    throw new apiError(401, "Invalid userId");
  }
  const user=await User.findById(userId)
  if(!user){
    throw new apiError(404,"user not found")
  }
  const tweets = await Tweet.find({
    owner: userId,
  }).select("-_id -createdAt -updatedAt -__v -owner");

  if (!tweets.length) {
    throw new apiError(500, "No tweets found");
  }

  res
    .status(200)
    .json(new apiResponse(200, tweets, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new apiError(401, "Invalid tweetId");
  }
  const { content } = req.body;

  if (!content || !content.trim()) {
    throw new apiError(401, "Tweet cannot be empty");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new apiError(404, "tweet not found");
  }
  if (tweet.owner.toString() != req.user._id) {
    throw new apiError(403, "action not allowed");
  }
  const updatedTweet = await Tweet.findByIdAndUpdate(
    { _id: tweetId },
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );
  res.status(200).json(new apiResponse(200, updatedTweet, "tweet updated"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new apiError(401, "Invalid tweetId");
  }
  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new apiError(404, "tweet not found");
  }
  if (tweet.owner.toString() != req.user._id) {
    throw new apiError(403, "action not allowed");
  }
  await tweet.deleteOne({
    _id: tweetId,
  });
  await Like.deleteMany({
    tweet: tweetId,
  });
  res.status(200).json(new apiResponse(200, [], "tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
