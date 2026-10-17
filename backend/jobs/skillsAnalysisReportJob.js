import cron from "node-cron";
import { sendSkillsAnalysisReportsToAllUsers } from "../services/skillsAnalysisReportService.js";

/**
 * Initialize the monthly skills analysis report job
 * Runs on the last day of each month at 9:00 AM
 * Cron expression: "0 9 28-31 * *" means:
 * - Minute: 0
 * - Hour: 9 (9 AM)
 * - Day: 28-31 (catches the last day of all months)
 * - Month: * (every month)
 * - Weekday: * (every day of week)
 * 
 * Note: The job will run on days 28-31, but will only execute on valid dates.
 * E.g., Feb 29 will only run on leap years, Feb 28 on non-leap years.
 */
export const initializeSkillsAnalysisReportJob = () => {
  console.log("📅 Initializing skills analysis report scheduler...");

  // Schedule to run at 9 AM on the last possible days of the month
  // This captures the last day for all months (28-31)
  const job = cron.schedule("0 9 28-31 * *", async () => {
    // Double-check it's actually the last day of the month
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Only run if tomorrow is the 1st (meaning today is the last day)
    if (tomorrow.getDate() === 1) {
      console.log("\n📧 Monthly Skills Analysis Report Job Started");
      console.log(`⏰ Time: ${new Date().toISOString()}`);
      await sendSkillsAnalysisReportsToAllUsers();
      console.log("✅ Monthly Skills Analysis Report Job Completed\n");
    }
  });

  // Also provide a manual trigger endpoint by returning the job
  return job;
};

/**
 * For testing purposes: Send reports immediately
 */
export const triggerSkillsAnalysisReportNow = async () => {
  console.log("🚀 Triggering immediate skills analysis report distribution...");
  return await sendSkillsAnalysisReportsToAllUsers();
};
