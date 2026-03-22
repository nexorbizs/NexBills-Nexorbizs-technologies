import prisma from "../config/prisma.js";

export const logActivity = async ({
  companyId,
  userId,
  branchId,
  userName,
  branchName,
  module,
  action,
  summary,
  details = ""
}) => {
  try {
    await prisma.activityLog.create({
      data: {
        companyId,
        userId: userId || null,
        branchId: branchId || null,
        userName: userName || "Unknown",
        branchName: branchName || "",
        module,
        action,
        summary,
        details
      }
    });
  } catch (err) {
    console.error("Activity log failed:", err.message);
  }
};