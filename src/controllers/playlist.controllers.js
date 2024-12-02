import asyncHandler from "../utils/asyncHandler.js";
import apiResponse from "../utils/apiResponse.js";
import apiError from "../utils/apiError.js";
import Playlist from "../models/playlist.models.js";
import mongoose, { isValidObjectId } from "mongoose";
import Video from "../models/video.models.js";

// import Video from "../models/video.models";

const createPlaylist = asyncHandler(async (req, res) => {
  //TODO: create playlist
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    throw new apiError(403, "Playlist name is required");
  }
  const owner = req.user._id;

  const ExistedPlaylist = await Playlist.findOne({
    $and: [{ owner: owner }, { name: name.toLowerCase() }],
  });

  if (ExistedPlaylist) {
    throw new apiError(403, "Playlist with this name already exists");
  }

  const playlist = await Playlist.create({
    name: name.toLowerCase(),
    description,
    owner,
  });
  if (!playlist) {
    throw new apiError(500, "Something went wrong while creating playlist");
  }
  res
    .status(201)
    .json(new apiResponse(201, playlist, "Playlist Created Successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!userId || !isValidObjectId(userId)) {
    throw new apiError(401, "UserId is Invalid");
  }
  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
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
            //Because I am looking at User field but I am currently at Video Field
            $project: {
              _id: 0,
              thumbnail: 1,
              videoFile: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        videos: "$videos", //because multiple videos hence no first
      },
    },
    {
      $project: {
        _id: 0,
        name: 1,
        description: 1,
        videos: 1,
      },
    },
  ]);
  if (!playlists.length) {
    throw new apiError(404, "No Playlists found for this user");
  }
  res
    .status(200)
    .json(new apiResponse(200, playlists, "Playlist Fetched Successfully!"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new apiError(401, "Playlist Id is Invalid");
  }
  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
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
                    fullname: 1,
                    avatar: 1,
                    username: 1,
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
            //Because I am looking at User field but I am currently at Video Field
            $project: {
              _id: 0,
              thumbnail: 1,
              videoFile: 1,
              title: 1,
              description: 1,
              duration: 1,
              views: 1,
              owner: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        videos: "$videos",
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
              fullname: 1,
              avatar: 1,
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
        //project uska hota hai jaha se lookup hua naa ki jahaa lookup hua
        _id: 0,
        name: 1,
        description: 1,
        videos: 1,
        createdBy: 1,
      },
    },
  ]);
  if (!playlist) {
    throw new apiError(404, "Playlist does not exist");
  }
  res
    .status(200)
    .json(new apiResponse(200, playlist, "Playlist fetched successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  //need playlist Id and Video Id
  //find Playlist
  //find Video
  //check if user is the owner of playlist
  //if video already exist throw errror
  //else push the video
  const { playlistId, videoId } = req.params;

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new apiError(400, "Invalid playlist Id");
  }

  if (!videoId || !isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video Id");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new apiError(404, "Playlist doesn't exist");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video doesn't exist");
  }

  if (playlist.owner.toString() != req.user._id) {
    throw new apiError(403, "Action not allowed");
  }

  if (playlist.videos.includes(videoId)) {
    throw new apiError(403, "Video alreadys exists in the playlist");
  }
  const updatedPlaylist = await Playlist.updateOne(
    { _id: playlistId },
    {
      $addToSet: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );
  res
    .status(201)
    .json(new apiResponse(201, updatePlaylist, "Playlist Updated"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new apiError(400, "Invalid playlist Id");
  }

  if (!videoId || !isValidObjectId(videoId)) {
    throw new apiError(400, "Invalid video Id");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new apiError(404, "Playlist doesn't exist");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new apiError(404, "Video doesn't exist");
  }

  if (playlist.owner.toString() != req.user._id) {
    throw new apiError(403, "Action not allowed");
  }

  if (!playlist.videos.includes(videoId)) {
    throw new apiError(403, "Video doesn't exist in playlist");
  }

  const updatedPlaylist = await Playlist.updateOne(
    { _id: playlistId },
    {
      $pull: {
        videos: videoId,
      },
    },
    {
      new: true,
    }
  );
  res
    .status(201)
    .json(new apiResponse(201, updatedPlaylist, "Playlist Updated"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new apiError(400, "Invalid playlist Id");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new apiError(404, "Playlist doesn't exist");
  }
  if (playlist.owner.toString() != req.user._id) {
    throw new apiError(403, "Action not allowed");
  }
  const isDeleted = await Playlist.deleteOne({
    _id: playlistId,
  });
  if (!isDeleted) {
    throw new apiError("Something went wrong while deleting the playist");
  }
  res
    .status(201)
    .json(
      new apiResponse(
        201,
        { isDeleted: isDeleted },
        "Playlust Deleted Successfully"
      )
    );
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!playlistId || !isValidObjectId(playlistId)) {
    throw new apiError(400, "Invalid playlist Id");
  }
  if (!name || !name.trim()) {
    throw new apiError(400, "Playlist Name is required");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new apiError(404, "Playlist Does not Exist");
  }
  if (playlist.owner.toString() != req.user._id) {
    throw new apiError(403, "Action not allowed");
  }
  playlist.name = name;
  playlist.description = description;
  playlist.save({ validateBeforeSave: false });
  res.status(200).json(new apiResponse(200, playlist, "Playlist updated"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
