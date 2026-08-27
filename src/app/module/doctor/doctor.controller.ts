import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { DoctorServices } from "./doctor.service";
import {
  ApplyAsDoctorValidationZodSchema,
  ApproveDoctorValidationZodSchema,
  VerifyDoctorEmailValidationZodSchema,
} from "./doctor.validation";

const applyAsDoctor = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  console.log({ files });
  const resume = files?.["resume"] ? files["resume"][0] : null;
  const additionalFiles = files?.["additionalFiles"] || [];

  const zodValidationResult = ApplyAsDoctorValidationZodSchema.safeParse(
    JSON.parse(req.body.data),
  );
  // fdsfjkjdf

  if (!zodValidationResult.success) {
    throw new Error(zodValidationResult.error.issues[0].message);
  }

  const payload = zodValidationResult.data;

  const result = await DoctorServices.applyAsDoctor(
    payload,
    resume,
    additionalFiles,
  );
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Applied As Doctor Successfuly",
    data: result,
  });
});

const verifyDoctorEmail = catchAsync(async (req: Request, res: Response) => {
  const zodValidationResult = VerifyDoctorEmailValidationZodSchema.safeParse(
    req.body,
  );

  if (!zodValidationResult.success) {
    throw new Error(zodValidationResult.error.issues[0].message);
  }

  const payload = zodValidationResult.data;

  const result = await DoctorServices.verifyDoctorEmail(payload);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Doctor Email Verified Successfuly",
    data: result,
  });
});

const approveDoctor = catchAsync(async (req: Request, res: Response) => {
  const zodValidationResult = ApproveDoctorValidationZodSchema.safeParse(
    req.body,
  );

  if (!zodValidationResult.success) {
    throw new Error(zodValidationResult.error.issues[0].message);
  }

  const payload = zodValidationResult.data;
  const user = req.user!;

  const result = await DoctorServices.approveDoctor(payload, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Doctor Approved Successfuly",
    data: result,
  });
});

const getAllDoctor = catchAsync(async (req: Request, res: Response) => {
  const { data, meta } = await DoctorServices.getAllDoctors(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Doctor Retrieved Successfuly",
    data: data,
    meta: meta,
  });
});

export const DoctorController = {
  applyAsDoctor,
  approveDoctor,
  verifyDoctorEmail,
  getAllDoctor,
};
