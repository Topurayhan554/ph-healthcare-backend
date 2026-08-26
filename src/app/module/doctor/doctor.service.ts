import { transporter } from "./../../lib/nodemailer";
import bcrypt from "bcryptjs";
import type { UploadApiResponse } from "cloudinary";
import {
  DoctorVerificationStatus,
  Role,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import crypto from "crypto";
import { redisClient } from "../../lib/redis";
import path from "path";
import ejs from "ejs";
import {
  IApplyAsDoctorPayload,
  IApproveDoctorPayload,
  IVerifyDoctorEmailPayload,
} from "./doctor.interface";
import { RequestUser } from "../../middleware/checkAuth";

// applyDoctor
const applyAsDoctor = async (
  payload: IApplyAsDoctorPayload,
  resume: Express.Multer.File | null,
  additionalFiles: Express.Multer.File[],
) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      email: payload.user.email,
    },
  });

  if (isUserExists) {
    throw new Error("User Already Exists With This Email");
  }

  const resumeUploadResult = await new Promise<UploadApiResponse>(
    (resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "auto",
          },

          async (error, result) => {
            if (error) {
              return reject(error);
            }

            if (!result) {
              return reject(new Error("No result returned from Cloudinary"));
            }

            resolve(result);
          },
        )
        .end(resume?.buffer);
    },
  );

  console.log({ resumeUploadResult });

  const additionalFilesUploadResults = await Promise.all(
    additionalFiles.map((file) => {
      return new Promise<UploadApiResponse>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "auto",
            },

            async (error, result) => {
              if (error) {
                return reject(error);
              }

              if (!result) {
                return reject(new Error("No result returned from Cloudinary"));
              }

              resolve(result);
            },
          )
          .end(file.buffer);
      });
    }),
  );

  console.log({ additionalFilesUploadResults });

  const randomDoctorPassword = Math.random().toString(36).slice(-8);

  const hashedPassword = await bcrypt.hash(
    randomDoctorPassword,
    Number(config.bcrypt_salt_rounds),
  );

  const doctorApplication = await prisma.user.create({
    data: {
      ...payload.user,
      password: hashedPassword,
      role: Role.DOCTOR,
      needPasswordChange: true,
      doctor: {
        create: {
          name: payload.user.name,
          email: payload.user.email,
          ...payload.doctor,
          resume: resumeUploadResult.secure_url,
          resumePublicId: resumeUploadResult.public_id,
          additionalFiles: additionalFilesUploadResults.map((file) => ({
            url: file.secure_url,
            publicId: file.public_id,
          })),
        },
      },
    },

    include: {
      doctor: true,
    },
  });

  const expirationSeconds = 60 * 60;
  const otpKey = `doctor-application-otp:${payload.user.email}`;
  const otpValue = crypto.randomInt(100000, 1000000).toString();

  await redisClient.set(otpKey, otpValue, {
    expiration: {
      type: "EX",
      value: expirationSeconds,
    },
  });

  const templatePath = path.join(
    process.cwd(),
    "src/app/templates/registration-user-otp.ejs",
  );

  const templateData = {
    name: payload.user.name,
    email: payload.user.email,
    otp: otpValue,
    expirationSeconds: expirationSeconds / 60,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: payload.user.email,
    subject: "Doctor Application - Email Verification",
    html,
  });

  return doctorApplication;
};

const verifyDoctorEmail = async (payload: IVerifyDoctorEmailPayload) => {
  const otp = payload.otp;
  const email = payload.email.trim().toLocaleLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
      role: Role.DOCTOR,
    },
  });

  if (!existingUser) {
    throw new Error("Doctor Application Not Found. Please apply again");
  }

  if (existingUser.emailVerified) {
    throw new Error("Email Already Verified");
  }

  const otpKey = `doctor-application-otp:${email}`;
  const redisOtp = await redisClient.get(otpKey);

  if (!redisOtp) {
    throw new Error(
      "OTP Expired. Your Applicaiton Window Has Closed. Please Try Again.",
    );
  }

  if (redisOtp !== otp) {
    throw new Error("OTP Does Not Match!");
  }

  await redisClient.del(otpKey);

  const verifiedUser = await prisma.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      emailVerified: true,
    },
    omit: {
      password: true,
    },
    include: {
      doctor: true,
    },
  });

  return verifiedUser;
};

const approveDoctor = async (
  payload: IApproveDoctorPayload,
  reviewer: RequestUser,
) => {
  const { doctorId, verificationStatus, rejectionReason } = payload;

  const existingDoctor = await prisma.doctor.findUnique({
    where: {
      id: doctorId,
    },
    include: {
      user: true,
    },
  });

  if (!existingDoctor) {
    throw new Error("Doctor Application Not Found");
  }

  if (existingDoctor.isDeleted) {
    throw new Error("Doctor Application Has Been Deletede");
  }

  if (!existingDoctor.user.emailVerified) {
    throw new Error(
      "Doctor Has Not Verified Their Email Yet. Application Cannot Be Reviewed.",
    );
  }

  if (existingDoctor.verificationStatus !== DoctorVerificationStatus.PENDING) {
    throw new Error(
      `Doctor Application Has Already Been ${existingDoctor.verificationStatus.toLocaleLowerCase()}`,
    );
  }

  if (
    verificationStatus === DoctorVerificationStatus.REJECTED &&
    !rejectionReason
  ) {
    throw new Error(
      "Rejection Reason Is Required When Rejection A Doctor Appication",
    );
  }

  const updateDoctor = await prisma.doctor.update({
    where: {
      id: doctorId,
    },
    data: {
      verificationStatus,

      rejectionReason:
        verificationStatus === DoctorVerificationStatus.REJECTED
          ? rejectionReason
          : null,

      reviewedBy: reviewer.userId,
      reviewedAt: new Date(),
    },
  });

  const isApproved = verificationStatus === DoctorVerificationStatus.APPROVED;

  const templatePath = path.join(
    process.cwd(),
    `src/app/templates/${isApproved ? "doctor-application-approved.ejs" : "doctor-application-rejected.ejs"}`,
  );

  const templateData = {
    name: updateDoctor.name,
    reason: updateDoctor.rejectionReason,
  };

  const html = await ejs.renderFile(templatePath, templateData);

  await transporter.sendMail({
    from: config.email_sender,
    to: updateDoctor.email,
    subject: isApproved
      ? "Your Doctor Application Has Been Approved"
      : "Your Doctor Application Has Been Rejected",
    html,
  });

  return updateDoctor;
};

const getAllDoctors = async () => {
  // search , filter, sorting , pagination
  const allDoctors = await prisma.doctor.findMany({});
  return allDoctors;
};

export const DoctorServices = {
  applyAsDoctor,
  approveDoctor,
  verifyDoctorEmail,
  getAllDoctors,
};
