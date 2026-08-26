import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { DoctorServices } from "./doctor.service";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";

const applyAsDoctor = catchAsync(async (req: Request, res: Response) => {
  const result = await DoctorServices.applyAsDoctor();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Applied As Doctor Successfully",
    data: result,
  });
});

export const DoctorController = {
  applyAsDoctor,
};
