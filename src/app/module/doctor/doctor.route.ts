import { Router } from "express";
import { upload } from "../../lib/multer";
import { DoctorController } from "./doctor.controller";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/apply-as-doctor",
  // validateRequest(UserValidation.ResetPasswordZodSchema),
  upload.fields([
    {
      name: "resume",
      maxCount: 1,
    },

    {
      name: "additionalFiles",
      maxCount: 10,
    },
  ]),
  DoctorController.applyAsDoctor,
);

router.post(
  "/apply-as-doctor/verify-email",

  DoctorController.verifyDoctorEmail,
);
router.post(
  "/approve-doctor",
  auth(Role.ADMIN, Role.SUPER_ADMIN),

  DoctorController.approveDoctor,
);
router.get(
  "/all-doctor",
  auth(Role.ADMIN, Role.SUPER_ADMIN),

  DoctorController.getAllDoctor,
);
export const DoctorRoutes = router;
