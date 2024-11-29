import mongoose, { isValidObjectId } from "mongoose";
import Comment from "../models/comment.models.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);
  if (!videoId || !isValidObjectId(videoId)) {
    throw new apiError(401, "Invalid VideoId");
  }
  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
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
              _id:0,
              username: 1,
              fullname: 1,
              avatar: 1,
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
        _id:0,
        content: 1,
        createdBy: 1,
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: limit,
    },
  ]);

  res
    .status(200)
    .json(new apiResponse(200, comments, "Comments Fetched Successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new apiError(401, "Invalid videoId");
  }
  const { content } = req.body;
  if (!content || !content.trim()) {
    throw new apiError(403, "Comments cannot be empty");
  }
  const comment = await Comment.create({
    content,
    owner: req.user._id,
    video: videoId,
  });
  if (!comment) {
    throw new apiError("Something went wrong adding comment");
  }
  res
    .status(201)
    .json(new apiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  if (!commentId || !isValidObjectId(commentId)) {
    throw new apiError(401, "Invalid commentId");
  }
  const { content } = req.body;
  if (!content || !content.trim()) {
    throw new apiError(403, "Comment cannot be empty");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new apiError(404, "Comment not found");
  }
  if (comment.owner.toString() != req.user._id) {
    throw new apiError(403, "Action not allowed");
  }
  comment.content = content;
  await comment.save({ validateBeforeSave: false });
  res
    .status(200)
    .json(new apiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  // TODO: update a comment
  const { commentId } = req.params;
  if (!commentId || !isValidObjectId(commentId)) {
    throw new apiError(401, "Invalid commentId");
  }
  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new apiError(404, "Comment not found");
  }
  if (comment.owner.toString() != req.user._id) {
    throw new apiError(403, "Action not allowed");
  }
  const isDeleted = await Comment.deleteOne({
    _id: commentId,
  });
  res.status(200).json(new apiResponse(200, isDeleted, "Comment deleted"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
