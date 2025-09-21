import {Categories} from "../models/product";
import {isValid, parseISO} from "date-fns";
import {isValidObjectId} from "mongoose";
import * as yup from "yup";

const emailRegex =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;

export const userSchema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup
    .string()
    .matches(emailRegex, "Invalid email format")
    .required("Email is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      passwordRegex,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    .required("Password is required"),
});

export const verifyUserSchema = yup.object({
  id: yup.string().test({
    name: "valid-id",
    message: "Invalid User ID",
    test: (value) => isValidObjectId(value),
  }),
  token: yup.string().required("Token is required"),
});

export const forgotPassSchema = yup.object({
  id: yup.string().test({
    name: "valid-id",
    message: "Invalid User ID",
    test: (value) => isValidObjectId(value),
  }),
  token: yup.string().required("Token is required"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      passwordRegex,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    .required("Password is required"),
});

export const productSchema = yup.object({
  name: yup.string().required("Name is required"),
  price: yup
    .string()
    .transform((value) => {
      if (isNaN(+value)) return "";
      return +value;
    })
    .required("Price is required"),
  purchasingDate: yup
    .string()
    .test("is-date", "Invalid date", (val) => !isNaN(Date.parse(val ?? "")))
    .required("Purchased Date is required"),

  category: yup
    .string()
    .oneOf(Categories, "Invalid category")
    .required("Category is required"),
  description: yup.string().required("Description is required"),
});
