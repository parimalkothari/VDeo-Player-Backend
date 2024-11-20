import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import User from "../models/user.models.js";
import fileUploader from "../utils/cloudinary.js";
import apiResponse from "../utils/apiResponse.js";

const generateAccessAndRefreshTokens = async (newUser) => {
  try {
    const accessToken = newUser.generateAccessToken();
    const refreshToken = newUser.generateRefreshToken();
    newUser.refreshToken = refreshToken;
    await newUser.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    res.status(500).json({
      error: error.message
    })
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
  const loggedInUser = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: "" } },
    { new: true }
  ); //new true gives update user as result
  console.log(loggedInUser);

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

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken= req.cookies.refreshToken
    if(!incomingRefreshToken){
      throw new apiError(401,"Unauthorized access")
    }
    const user= await User.findById(req.user._id)
    if(incomingRefreshToken!=user.refreshToken){
      throw new apiError("Refresh Token expired or Invalid!")
    }
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user)
    const options={
      httpOnly:true,
      secure:true
    }
    res
    .status(201)
    .cookie('accessToken',accessToken,options)
    .cookie('refreshToken',refreshToken,options)
    .json(new apiResponse(201, "Access Token is Refreshed"))

})

export { registerUser, loginUser, logOutUser, refreshAccessToken };
