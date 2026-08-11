import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AuthController } from "./auth.controller";
import { UserValidation } from "./auth.validation";
import z from "zod";
import { validatedRequest } from "../../middleware/validateRequest";

const router = Router();

router.post(
  "/register",
  // (req: Request, res: Response, next: NextFunction) => {
  //   try {
  //     const payload = req.body ?? {};

  //     const result =
  //       PatientValidation.PatientRegistrationZodSchema.safeParse(payload);

  //     if (!result.success) {
  //       throw new Error(result.error.issues[0].message);
  //     }

  //     req.body = result.data;

  //     next();
  //   } catch (error) {
  //     next(error);
  //   }
  // },

  validatedRequest(UserValidation.PatientRegistrationZodSchema),
  AuthController.registerPatient,
);
router.post(
  "/login",
  validatedRequest(UserValidation.loginZodSchema),
  AuthController.loginUser,
);
router.get(
  "/me",
  auth(Role.ADMIN, Role.DOCTOR, Role.PATIENT, Role.SUPER_ADMIN),
  AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/google", AuthController.googleLogin);
export const AuthRoutes = router;
