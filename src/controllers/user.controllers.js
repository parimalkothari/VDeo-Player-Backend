import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import User from "../models/user.models.js";
import fileUploader from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";

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

export { registerUser };
