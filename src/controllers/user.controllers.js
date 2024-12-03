import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import User from "../models/user.models.js";
import Comment from "../models/comment.models.js";
import Tweet from "../models/tweet.models.js";
import Video from "../models/video.models.js";
import Like from "../models/like.models.js";
import Playlist from "../models/playlist.models.js";
import Subscription from "../models/subscription.models.js";
import fileUploader from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";
import mongoose, { isValidObjectId } from "mongoose";
import deleteFromCloudinary from "../utils/deleteFromCloudinary.js";

const generateAccessAndRefreshTokens = async (newUser) => {
  try {
    const accessToken = newUser.generateAccessToken();
    const refreshToken = newUser.generateRefreshToken();
    newUser.refreshToken = refreshToken;
    await newUser.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
};
const registerUser = asyncHandler(async (req, res) => {
  //get user details
  //check for validation
  //check if user already present: username, email
  //check if images present in avatar or coverimage
  //upload on cloudinary
  //create user object
  //create entry in db
  //remove password and refresh token field from response
  //check for user creation successfully
  const { fullname, email, password, username } = req.body;
  if (
    [fullname, email, password, username].some((field) => {
      return field.trim() === "";
    })
  ) {
    throw new apiError(401, "All Fields are required!");
  }

  const ExistedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (ExistedUser) {
    throw new apiError(409, "User already exists!");
  }
  if (!req.files.avatar) {
    throw new apiError(409, "Avatar is required!");
  }
  const avatarLocalPath = req?.files?.avatar[0]?.path;
  const avatar = await fileUploader(avatarLocalPath);

  let coverImageLocalPath = null;
  if (req.files.coverImage) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  const coverImage = await fileUploader(coverImageLocalPath);

  if (!avatar) {
    throw new apiError(409, "Avatar is required!");
  }

  const newUser = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );
  if (!createdUser) {
    throw new apiError(500, "Something went wrong");
  }

  return res
    .status(201)
    .json(new apiResponse(200, createdUser, "User Created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  //Get Username/email and Password from user
  //Validate the fields
  //Check if user exists in mongo database
  //else ask him to register first
  //if exists match the password
  //access and refresh token generate
  //send as Cookies

  const { username, email, password } = req.body;

  if (!(username || email)) {
    throw new apiError(400, "Username or email is required!");
  }

  const newUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!newUser) {
    throw new apiError(400, "User doesn't exist");
  }

  const isPasswordValid = await newUser.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new apiError(401, "Invalid User Credentials");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(newUser);

  //User with updated accessToken
  const loggedInUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  const options = {
    //only server can edit the cookies
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        201,
        {
          user: loggedInUser,
          accessToken,
          refreshToken, // ex for mobile applications where cookies can not be stored
        },
        "User logged in Successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  //clear cookies
  //remove refresh token from database (for this you need user...accessed by middleware)
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: "" } },
    { new: true }
  ); //new true gives update user as result

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(201)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(201, {}, "User logged out"));
});

const deleteAccount = asyncHandler(async (req, res) => {
 
  //Delete from cloudinary
  await deleteFromCloudinary(req.user.avatar);
  if (req.user.coverImage) {
    await deleteFromCloudinary(req.user.coverImage);
  }
  const videos=await Video.find({
    owner:req.user._id
  })
  for (const video of videos) {
    await deleteFromCloudinary(video.thumbnail);
    await deleteFromCloudinary(video.videoFile);
  }

  //delete everything related
  await Comment.deleteMany({
    owner: req.user._id,
  });
  await Tweet.deleteMany({
    owner: req.user._id,
  });
  await Video.deleteMany({
    owner: req.user._id,
  });
  await Subscription.deleteMany({
    $or: [{ channel: req.user._id }, { subscriber: req.user._id }],
  });
  await Playlist.deleteMany({
    owner: req.user._id,
  });
  await Like.deleteMany({
    likedBy: req.user._id,
  });

  //delete user
  await User.deleteOne({
    _id: req.user._id,
  });

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new apiResponse(200, [], "account deleted successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken;
  if (!incomingRefreshToken) {
    throw new apiError(401, "Unauthorized access");
  }
  const user = await User.findById(req.user._id);
  if (incomingRefreshToken != user.refreshToken) {
    throw new apiError("Refresh Token expired or Invalid!");
  }
  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user);
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new apiResponse(201, "Access Token is Refreshed"));
});

const updateCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confPassword } = req.body;
  if (
    [oldPassword, newPassword, confPassword].some((field) => {
      return field.trim() == "";
    })
  ) {
    throw new apiError(403, "Password cannot be empty");
  }

  if (newPassword != confPassword) {
    throw new apiError(400, "New Password and Confirm Password should be same");
  }

  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new apiError(400, "Current Password is Invalid");
  }
  if (newPassword == oldPassword) {
    throw new apiError(400, "New Password cannot be same as old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new apiResponse(200, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.user, "Current user fetched Successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { email, fullname } = req.body;
  if (!email && !fullname) {
    throw new apiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        email,
        fullname,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new apiResponse(200, user, "Account Details Updated!"));
});

//Dont forget to give multer as a middleware
const updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new apiError(401, "Avatar is required!");
  }
  await deleteFromCloudinary(req.user.avatar);
  const avatarLocalPath = req.file.path; //because only one file would be passed at a time
  const newAvatar = await fileUploader(avatarLocalPath);
  if (!newAvatar) {
    throw new apiError(401, "Action Failed");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: newAvatar.url,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new apiResponse(200, user, "Avatar Updated Successfully"));
});

//Dont forget to give multer as a middleware
const updateCoverImage = asyncHandler(async (req, res) => {
  let newCoverImageUrl;
  if (req.file) {
    if (req.user.coverImage) {
      await deleteFromCloudinary(req.user.coverImage);
    }
    const coverImageLocalPath = req.file.path; //because only one file would be passed at a time
    const newCoverImage = await fileUploader(coverImageLocalPath);
    newCoverImageUrl = newCoverImage.url;
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: newCoverImageUrl || "",
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new apiResponse(200, user, "CoverImage Updated Successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username || !username.trim()) {
    throw new apiError(401, "Username is required");
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions", //Subscriber as appears in mongodb
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        fullname: 1,
        email: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
  if (!channel.length) {
    throw new apiError(404, "Channel doesn't exist");
  }
  console.log(channel);
  return res
    .status(200)
    .json(
      new apiResponse(200, channel[0], "Channel details fetched successfully")
    );
});

const addVideoToWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new apiError(401, "Invalid videoId");
  }
  const video=await Video.findById(videoId)
  if(!video){
    throw new apiError(404,"Video not found")
  }
  const user = await User.findById(req.user._id);

  if (user.watchHistory.includes(videoId)) {
    throw new apiError(403, "video already present in watch history");
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $addToSet: {
        watchHistory: videoId,
      },
    },
    { new: true }
  );
  if (!user) {
    throw new apiError(404, "Something went wrong");
  }
  res
    .status(200)
    .json(
      new apiResponse(
        200,
        { watchHistory: updatedUser.watchHistory },
        "watch history updated"
      )
    );
});

const deleteVideoFromWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId || !isValidObjectId(videoId)) {
    throw new apiError(401, "Invalid videoId");
  }
  const video=await Video.findById(videoId)
  if(!video){
    throw new apiError(404,"Video not found")
  }
  const user = await User.findById(req.user._id);

  if (!user.watchHistory.includes(videoId)) {
    throw new apiError(404, "video not present in watch history");
  }
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $pull: {
        watchHistory: videoId,
      },
    },
    { new: true }
  );
  if (!user) {
    throw new apiError(404, "Something went wrong");
  }
  res
    .status(200)
    .json(
      new apiResponse(
        200,
        { watchHistory: updatedUser.watchHistory },
        "watch history updated"
      )
    );
});

const clearWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        watchHistory: [],
      },
    },
    { new: true }
  );

  if (!user) {
    throw new apiError(500, "Something went wrong");
  }

  res
    .status(200)
    .json(
      new apiResponse(
        200,
        { watchHistory: user.watchHistory },
        "watch history cleared successfully"
      )
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const watchHistory = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
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
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner", //as result is inside array hence we add it as a field itself
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
            },
          },
        ],
      },
    },
    {
      $addFields: {
        watchHistory: "$watchHistory",
      },
    },
    {
      $project: {
        _id: 0,
        username: 1,
        fullname: 1,
        watchHistory: 1,
      },
    },
  ]);

  res
    .status(200)
    .json(
      new apiResponse(
        200,
        watchHistory[0],
        "Watch History Fetched Successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logOutUser,
  deleteAccount,
  refreshAccessToken,
  updateCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  addVideoToWatchHistory,
  deleteVideoFromWatchHistory,
  clearWatchHistory,
};
