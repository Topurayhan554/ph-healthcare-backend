import cron from "node-cron";
import { prisma } from "./prisma";
import { DoctorVerificationStatus, Role } from "../../generated/prisma/enums";

export const deleteUnverifiedDoctors = async () => {
  cron.schedule("*/10 * * * *", async () => {
    //   prisma business => doctors delete

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const deleteDoctors = await prisma.user.deleteMany({
        where: {
          role: Role.DOCTOR,
          emailVerified: false,
          createdAt: {
            lt: oneHourAgo,
          },
          doctor: {
            verificationStatus: DoctorVerificationStatus.PENDING,
          },
        },
      });

      if (deleteDoctors.count > 0) {
        console.log(`
        Cron: Deleted ${deleteDoctors.count} unverified email doctor application older than 1 hour
        `);
      }
    } catch (error) {
      console.log(
        "Cron: Failed to delete unverified doctor applications",
        error,
      );
    }
    console.log("Unverified Doctor Delete cron schedule (every 10 minutes)");
  });
};
