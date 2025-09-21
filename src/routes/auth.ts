import {
  createUser,
  signIn,
  verifyUserEmail,
  getProfile,
  signOut,
  requestEmailVerification,
  generateForgotPassLink,
  updatePassword,
  grantTokenValid,
  updateProfile,
  grantAccessToken,
  updateAvatar,
  getPublicProfile,
} from "../controllers/auth";
import {isAuth, isValidPassResetToken} from "../middlewares/auth";
import {fileParser} from "../middlewares/fileParser";
import {validate} from "../middlewares/validate";
import {
  forgotPassSchema,
  userSchema,
  verifyUserSchema,
} from "../utils/validationSchema";
import {Router} from "express";

const router = Router();

router.post("/sign-up", validate(userSchema), createUser);
router.post("/sign-in", signIn);
router.post("/sign-out", isAuth, signOut);
router.post("/refresh-token", grantAccessToken);
router.post("/verify-email", validate(verifyUserSchema), verifyUserEmail);
router.post("/generate-forgot-pass-link", generateForgotPassLink);
router.post(
  "/verify-reset-password-token",
  validate(verifyUserSchema),
  isValidPassResetToken,
  grantTokenValid
);
router.post(
  "/reset-password",
  validate(forgotPassSchema),
  isValidPassResetToken,
  updatePassword
);

router.patch("/update-profile", isAuth, updateProfile);
router.patch("/update-avatar", isAuth, fileParser, updateAvatar);

router.get("/request-email-verification", isAuth, requestEmailVerification);
router.get("/profile", isAuth, getProfile);
router.get("/get-public-profile/:id", isAuth, getPublicProfile);

export default router;
