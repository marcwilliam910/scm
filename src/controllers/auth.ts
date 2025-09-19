import UserModel from "@/models/user";
import {RequestHandler} from "express";
import crypto from "crypto";
import AuthVerificationTokenModel from "@/models/authVerificationToken";
import jwt from "jsonwebtoken";
import {mail} from "@/utils/mail";
import ForgotPasswordModel from "@/models/forgotPass";
import {v2 as cloudinary} from "cloudinary";
import {isValidObjectId} from "mongoose";
import cloudinaryUploader from "@/cloudinary";

const JWT_SECRET = process.env.JWT_SECRET!;
const BASE_URL = process.env.BASE_URL!;

export const createUser: RequestHandler = async (req, res) => {
  const {email, password, name} = req.body;

  const existingUser = await UserModel.findOne({email});

  if (existingUser) {
    return res.status(400).json({
      message: "User already exists",
    });
  }

  const newUser = await UserModel.create({email, password, name});

  const token = crypto.randomBytes(32).toString("hex");

  await AuthVerificationTokenModel.create({
    owner: newUser._id,
    token,
  });

  const link = `${BASE_URL}/verify.html?id=${newUser._id}&token=${token}`;

  await mail.sendEmailVerification(email, link);

  res.status(201).json({
    message: "User created, check your email",
    user: {
      _id: newUser._id,
      email: newUser.email,
      name: newUser.name,
    },
  });
};

export const verifyUserEmail: RequestHandler = async (req, res) => {
  const {id, token} = req.body;

  const authVerificationToken = await AuthVerificationTokenModel.findOne({
    owner: id,
  });
  if (!authVerificationToken) {
    return res.status(400).json({
      message: "Invalid User ID",
    });
  }

  const isMatched = await authVerificationToken.compareToken(token);
  if (!isMatched) {
    return res.status(400).json({
      message: "Invalid Token",
    });
  }

  await Promise.all([
    UserModel.findByIdAndUpdate(id, {verified: true}),
    AuthVerificationTokenModel.findOneAndDelete({
      owner: id,
    }),
  ]);

  res.status(200).json({
    message: "Email verified, you can now sign in",
  });
};

export const signIn: RequestHandler = async (req, res) => {
  const {email, password} = req.body;

  const user = await UserModel.findOne({email});
  if (!user) {
    return res.status(400).json({
      message: "Email does not exist",
    });
  }

  if (!user.verified) {
    return res.status(400).json({
      message: "Email is not verified",
    });
  }

  const isMatched = await user.comparePassword(password);
  if (!isMatched) {
    return res.status(400).json({
      message: "Invalid password",
    });
  }
  const payload = {
    id: user._id,
  };
  const accessToken = jwt.sign(payload, JWT_SECRET, {expiresIn: "15m"});
  const refreshToken = jwt.sign(payload, JWT_SECRET);

  if (!user.tokens) user.tokens = [refreshToken];
  else user.tokens.push(refreshToken);

  await user.save();

  res.status(200).json({
    message: "User signed in",
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
      avatar: {
        url: user.avatar?.url,
        id: user.avatar?.id,
      },
      verified: user.verified,
    },
    tokens: {
      accessToken,
      refreshToken,
    },
  });
};

export const getProfile: RequestHandler = async (req, res) => {
  res.status(200).json({
    message: "User profile",
    user: req.body.user,
  });
};

export const requestEmailVerification: RequestHandler = async (req, res) => {
  const {id, email} = req.body.user;
  const token = crypto.randomBytes(32).toString("hex");

  await Promise.all([
    AuthVerificationTokenModel.findOneAndDelete({
      owner: id,
    }),
    AuthVerificationTokenModel.create({
      owner: id,
      token,
    }),
  ]);

  const link = `${BASE_URL}/verify.html?id=${id}&token=${token}`;
  await mail.sendEmailVerification(email, link);

  res.status(200).json({
    message: "Email sent, check your email",
  });
};

export const signOut: RequestHandler = async (req, res) => {
  const {refreshToken} = req.body;
  const user = req.body.user;

  const userRes = await UserModel.findOne({
    _id: user.id,
    tokens: refreshToken,
  });

  if (!userRes) {
    return res.status(400).json({
      message: "Invalid refresh token, Unauthorized request",
    });
  }

  userRes.tokens = userRes.tokens.filter((token) => token !== refreshToken);

  await userRes.save();

  res.status(200).json({
    message: "User signed out",
  });
};

export const generateForgotPassLink: RequestHandler = async (req, res) => {
  const {email} = req.body;

  const user = await UserModel.findOne({email});
  if (!user) {
    return res.status(400).json({
      message: "Email does not exist",
    });
  }
  const token = crypto.randomBytes(32).toString("hex");
  const link = `${BASE_URL}/forgot-password.html?id=${user._id}&token=${token}`;

  let forgot = await ForgotPasswordModel.findOne({owner: user._id});

  if (forgot) {
    await ForgotPasswordModel.deleteOne({owner: user._id});
  }

  forgot = new ForgotPasswordModel({owner: user._id, token});
  await forgot.save(); // will trigger pre("save") and hash token

  await mail.sendForgotPassEmail(email, link);

  res.status(200).json({
    message: "Link sent, please check your email",
  });
};

export const grantTokenValid: RequestHandler = async (req, res) => {
  res.status(200).json({
    message: "Token is valid",
  });
};

export const updatePassword: RequestHandler = async (req, res) => {
  const {id, password} = req.body;

  const user = await UserModel.findById(id);

  if (!user) {
    return res.status(400).json({
      message: "Invalid User ID",
    });
  }

  user.password = password;

  await Promise.all([
    user.save(),
    ForgotPasswordModel.findOneAndDelete({owner: id}),
    mail.sendForgotPassSuccessEmail(user.email),
  ]);

  res.status(200).json({
    message: "Password updated",
  });
};

export const updateProfile: RequestHandler = async (req, res) => {
  const {id} = req.body.user;
  const {name} = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({
      message: "Name is required",
    });
  }

  await UserModel.findByIdAndUpdate(id, {name});

  res.status(200).json({
    message: "Profile updated",
    profile: {...req.body.user, name},
  });
};

export const grantAccessToken: RequestHandler = async (req, res) => {
  const {refreshToken} = req.body;
  const payload = jwt.verify(refreshToken, JWT_SECRET) as {id: string};

  if (!payload) {
    return res.status(400).json({
      message: "Invalid refresh token, Unauthorized request",
    });
  }

  const user = await UserModel.findOne({_id: payload.id, tokens: refreshToken});

  if (!user) {
    await UserModel.findByIdAndUpdate(payload.id, {tokens: []});
    return res.status(400).json({
      message: "Invalid refresh token, Unauthorized request",
    });
  }

  const newAccessToken = jwt.sign({id: payload.id}, JWT_SECRET, {
    expiresIn: "15m",
  });

  const newRefreshToken = jwt.sign({id: payload.id}, JWT_SECRET);

  user.tokens = user.tokens.filter((token) => token !== refreshToken);

  user.tokens.push(newRefreshToken);
  await user.save();

  res.status(200).json({
    message: "Access token granted",
    tokens: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
  });
};

export const updateAvatar: RequestHandler = async (req, res) => {
  const {id} = req.body.user;
  const {avatar} = req.body.files;

  console.log(id);
  console.log(avatar);

  if (Array.isArray(avatar)) {
    return res.status(400).json({
      message: "Must be a single file",
    });
  }

  if (!avatar.mimetype.startsWith("image/")) {
    return res.status(400).json({
      message: "Invalid file type, must be an image",
    });
  }

  const user = await UserModel.findById(id);

  if (!user) {
    return res.status(400).json({
      message: "Invalid User ID",
    });
  }

  if (user.avatar?.id) {
    await cloudinaryUploader.destroy(user.avatar.id);
  }

  const result = await cloudinaryUploader.upload(avatar.filepath, {
    folder: "avatars",
    height: 300,
    width: 300,
    crop: "thumb",
    gravity: "face",
  });

  user.avatar = {url: result.secure_url, id: result.public_id};
  await user.save();

  res.status(200).json({
    message: "Avatar updated",
    profile: {
      ...req.body.user,
      avatar: {url: result.secure_url, id: result.public_id},
    },
  });
};

export const getPublicProfile: RequestHandler = async (req, res) => {
  const {id} = req.params;

  if (!isValidObjectId(id))
    return res.status(400).json({message: "Invalid User ID"});

  const user = await UserModel.findById(id);

  if (!user) {
    return res.status(400).json({
      message: "Profile not found",
    });
  }

  res.status(200).json({
    message: "Public profile",
    profile: {id: user._id, name: user.name, avatar: user.avatar?.url},
  });
};
