import ForgotPasswordModel from "@/models/forgotPass";
import UserModel from "@/models/user";
import {RequestHandler} from "express";
import jwt, {JsonWebTokenError, TokenExpiredError} from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
export const isAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({message: "Unauthorized"});

    const payload = jwt.verify(token, JWT_SECRET) as {id: string};

    const user = await UserModel.findById(payload.id);

    if (!user) return res.status(401).json({message: "No user found"});

    req.body = {
      ...req.body,
      user: {
        id: payload.id,
        name: user.name,
        email: user.email,
        verified: user.verified,
        avatar: user.avatar,
      },
    };

    next();
  } catch (error) {
    if (error instanceof TokenExpiredError)
      return res.status(401).json({message: "Token expired"});
    if (error instanceof JsonWebTokenError)
      return res.status(401).json({message: "Invalid token"});
    next(error);
  }
};

export const isValidPassResetToken: RequestHandler = async (req, res, next) => {
  const {id, token} = req.body;

  const forgotPasswordToken = await ForgotPasswordModel.findOne({owner: id});
  if (!forgotPasswordToken)
    return res.status(400).json({message: "Invalid User ID"});

  const isMatched = await forgotPasswordToken.compareToken(token);
  if (!isMatched) return res.status(400).json({message: "Invalid Token"});

  next();
};
