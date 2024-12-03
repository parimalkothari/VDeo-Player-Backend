import mongoose, { isValidObjectId } from "mongoose";
import Video from "../models/video.models.js";
import apiError from "../utils/apiError.js";
import fileUploader from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Like from "../models/like.models.js";
import Comment from "../models/comment.models.js";
import User from "../models/user.models.js";
import deleteFromCloudinary from "../utils/deleteFromCloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "asc",
    userId = "",
  } = req.query;
  //TODO: get all videos based on query, sort, pagination
  if(userId){
    const user=await User.findById(userId)
    if(!user){
      throw new apiError(404,"User not found")
    }
  }
  const limitInt = parseInt(limit);
  const pageInt = parseInt(page);
  const videos = await Video.aggregate([
    {
      $match: {
        $and: [
          {
            $or: [
              { title: { $regex: query, $options: "i" } },
              { description: { $regex: query, $options: "i" } },
            ],
          },
          ...(userId ? [{ owner: new mongoose.Types.ObjectId(userId) }] : []), //...spread operator opens the array if userid is there condition will be applied else empty array will be opened
        ],
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
        owner: 1,
        createdBy: 1,
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

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title || !title.trim()) {
    throw new apiError(401, "Title is required");
  }
  if (!description || !description.trim()) {
    throw new apiError(401, "description is required");
  }
  if (!req.files || !req.files.videoFile || !req.files.thumbnail) {
    throw new apiError(404, "All files are required");
  }
  const VideoFilePath = req.files.videoFile[0].path;
  const thumbnailPath = req.files.thumbnail[0].path;
  const videoFile = await fileUploader(VideoFilePath);

  if (!videoFile) {
    throw new apiError(500, "Something went wrong while uploading the file");
  }
  const thumbnail = await fileUploader(thumbnailPath);

  if (!thumbnail) {
    throw new apiError(500, "Something went wrong while uploading the file");
  }
  const video = await Video.create({
    title,
    description,
    thumbnail: thumbnail.url,
    videoFile: videoFile.url,
    owner: req.user._id,
    duration: 3, //uploading img for now
  });
  if (!video) {
    throw new apiError(
      500,
      "Something went wrong while uploading the videofile"
    );
  }
  res
    .status(201)
    .json(new apiResponse(201, video, "Video Published Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!videoId || !isValidObjectId(videoId)) {
    throw new apiError(401, "Invalid VideoId");
  }
  const findVideo=await Video.findById(videoId)
  if(!findVideo){
    throw new apiError(404,"Video not found")
  }
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 0,
              avatar: 1,
              username: 1,
              fullname: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        _id: 0,
        createdAt: 0,
        updatedAt: 0,
        __v: 0,
      },
    },
  ]);

  if (!video) {
    throw new apiError(404, "No such file exists");
  }

  res
    .status(200)
    .json(new apiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!videoId || !isValidObjectId(videoId)) {
    throw new apiError(401, "Invalid VideoId");
  }
  const { title, description } = req.body;

  if (title && !title.trim()) {
    throw new apiError(401, "Title is required");
  }
  if (description && !description.trim()) {
    throw new apiError(401, "description is required");
  }
  if (!req.files || !req.files.thumbnail) {
    throw new apiError(404, "thumbnail is required");
  }
  const video = await Video.findById(videoId);
  if(!video){
    throw new apiError(404,"video not found")
  }
  if (video.owner.toString() != req.user._id) {
    throw new apiError(403, "Action not allowed");
  }
  await deleteFromCloudinary(video.thumbnail)
  const thumbnailPath = req.files.thumbnail[0].path;
  const thumbnail = await fileUploader(thumbnailPath);
  if (!thumbnail) {
    throw new apiError(500, "Something went wrong while uploading the file");
  }
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: thumbnail.url,
      },
    },
    {
      new: true,
    }
  );
  if (!updatedVideo) {
    throw new apiError(500, "Something went wrong while updating details");
  }
  res
    .status(200)
    .json(
      new apiResponse(200, updatedVideo, "Video details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!videoId || !isValidObjectId(videoId)) {
    throw new apiError(401, "Invalid VideoId");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found");
  }
  if (video.owner.toString() != req.user._id) {
    throw new apiError(403, "Action not allowed");
  }
  await Video.deleteOne({
    _id: videoId,
  });
  await deleteFromCloudinary(video.videoFile)
  await deleteFromCloudinary(video.thumbnail)
  
  await Like.deleteMany({
    video: videoId,
  });
  await Comment.deleteMany({
    video: videoId,
  });
  res.status(200).json(new apiResponse(200, [], "Video deleted"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new apiError(401, "Invalid VideoId");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video not found");
  }
  if (video.owner.toString() != req.user._id) {
    throw new apiError(403, "Action not allowed");
  }
  video.isPublished = !video.isPublished;
  video.save({ validateBeforeSave: false });
  res
    .status(200)
    .json(new apiResponse(200, video.isPublished, "Status changed"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
