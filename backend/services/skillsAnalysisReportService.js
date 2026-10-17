import User from "../models/User.js";
import SkillsAnalysis from "../skills-analysis/models/SkillsAnalysisModel.js";
import { generateAISuggestions } from "../skills-analysis/services/skillsAnalysisService.js";
import sendEmail from "./sendEmail.js";
import { getSkillsAnalysisReportTemplate } from "../utils/emailTemplates.js";

/**
 * Send skills analysis report to a single user
 */
export const sendSkillsAnalysisReportToUser = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User with ID ${userId} not found`);
      return false;
    }

    const analysis = await SkillsAnalysis.findOne({ userId });
    if (!analysis) {
      console.log(`No skills analysis data found for user ${userId}`);
      return false;
    }

    const suggestions = generateAISuggestions(analysis.toObject());
    const analysisData = {
      ...analysis.toObject(),
      suggestions,
    };

    const emailHTML = getSkillsAnalysisReportTemplate(
      user.firstName || "User",
      analysisData,
    );

    const sent = await sendEmail(
      user.email,
      "Your Monthly Skills Analysis Report",
      emailHTML,
    );

    if (!sent) {
      console.log(`Failed to send skills analysis report to ${user.email}`);
      return false;
    }

    console.log(`Skills analysis report sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error(
      `Error sending skills analysis report to user ${userId}:`,
      error.message,
    );
    return false;
  }
};

/**
 * Send skills analysis reports to all users
 */
export const sendSkillsAnalysisReportsToAllUsers = async () => {
  try {
    console.log("Starting monthly skills analysis report distribution...");

    const users = await User.find({});
    if (!users || users.length === 0) {
      console.log("No users found");
      return { success: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    for (const user of users) {
      const sent = await sendSkillsAnalysisReportToUser(user._id);
      if (sent) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    console.log(
      `Monthly skills analysis reports distribution completed. Success: ${successCount}, Failed: ${failedCount}`,
    );
    return { success: successCount, failed: failedCount };
  } catch (error) {
    console.error(
      "Error in sendSkillsAnalysisReportsToAllUsers:",
      error.message,
    );
    return { success: 0, failed: 0 };
  }
};
