import nodemailer from "nodemailer";
import config from "../config";

// transporter
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.smtp_user,
    pass: config.smtp_password,
  },
});
