import { z } from "zod";
import { DoctorVerificationStatus } from "../../../generated/prisma/enums";

export const ApplyAsDoctorValidationZodSchema = z.object({
  user: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters long"),

    email: z.email("Invalid email address").trim().toLowerCase(),
  }),

  doctor: z.object({
    address: z
      .string()
      .trim()
      .min(5, "Address must be at least 5 characters long")
      .optional(),

    specialization: z.string().trim().min(2, "Specialization is required"),

    licenseNumber: z.string().trim().min(3, "License number is required"),

    qualifications: z.string().trim().min(2, "Qualifications are required"),

    // Handles converting incoming FormData strings like "12" into an integer number
    experienceYears: z
      .number()
      .int("Experience years must be an integer")
      .min(0, "Experience years cannot be negative"),
    bio: z
      .string()
      .trim()
      .max(1000, "Bio cannot exceed 1000 characters")
      .optional(),

    // Handles converting incoming FormData strings like "150.00" into a float number
    consultationFee: z
      .number()
      .min(0, "Consultation fee cannot be negative")
      .optional(),
    contactNumber: z
      .string()
      .trim()
      .min(5, "Contact number is invalid")
      .optional(),
  }),
});
export const VerifyDoctorEmailValidationZodSchema = z.object({
  email: z.email("Invalid email address").trim().toLowerCase(),

  otp: z
    .string()
    .trim()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d+$/, "OTP must contain only digits"),
});

export const ApproveDoctorValidationZodSchema = z.object({
  doctorId: z.string().trim().min(1, "Doctor ID is required"),

  verificationStatus: z.enum(
    [DoctorVerificationStatus.APPROVED, DoctorVerificationStatus.REJECTED],
    "Verification status must be either APPROVED or REJECTED",
  ),

  rejectionReason: z
    .string()
    .trim()
    .min(1, "Rejection reason cannot be empty")
    .optional(),
});
