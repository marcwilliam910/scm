import {RequestHandler} from "express";
import {Schema, ValidationError} from "yup";

export const validate = (schema: Schema): RequestHandler => {
  return async (req, res, next) => {
    try {
      await schema.validate(req.body.fields, {abortEarly: true, strict: true});
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          message: error.message,
        });
      }

      next(error);
    }
  };
};
