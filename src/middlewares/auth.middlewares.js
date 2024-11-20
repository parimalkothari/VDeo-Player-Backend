import User from "../models/user.models.js";
import apiError from "../utils/apiError.js";
import jwt from "jsonwebtoken";
const verifyJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies.accessToken
      if (!token) {
          throw new apiError(401, "Unauthorized Request");
        }
    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );
    const loggedInUser = await User.findById(decodedToken._id).select(
        "-password -refreshToken"
    );
    if (!loggedInUser) {
      throw new apiError(401, "Unauthorized Request");
    }
    req.user = loggedInUser;
    // console.log(req.user)
    next();
  } catch (error) {
      res.status(403).json({
        error: error.message
      })
  }
};

export default verifyJWT;
