import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AuthController } from "./auth.controller";
import { UserValidation } from "./auth.validation";
import { validatedRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
  "/register",
  validatedRequest(UserValidation.PatientRegistrationZodSchema),
  AuthController.registerPatient,
);
router.post(
  "/verify-email",
  validatedRequest(UserValidation.PatientEmailVerifyZodSchema),
  AuthController.verifyPatientEmail,
);
router.post(
  "/resend-otp",
  validatedRequest(UserValidation.ResendOtpZodSchema),
  AuthController.resendOtp,
);
router.post(
  "/login",
  validatedRequest(UserValidation.LoginZodSchema),
  AuthController.loginUser,
);
router.get(
  "/me",
  auth(Role.ADMIN, Role.DOCTOR, Role.PATIENT, Role.SUPER_ADMIN),
  AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/google", AuthController.googleLogin);
router.post(
  "/forgot-password",
  validatedRequest(UserValidation.ForgotPasswordZodSchema),
  AuthController.forgotPassword,
);
router.post(
  "/reset-password",
  validatedRequest(UserValidation.ResetPasswordZodSchema),
  AuthController.resetPassword,
);

router.post("/logout", AuthController.logOut);
export const AuthRoutes = router;
