const brandColor = "#4f46e5";

const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f4f4f5;
      padding: 40px 0;
    }
    .email-content {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .email-header {
      background-color: ${brandColor};
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    .email-header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .email-body {
      padding: 40px 40px;
      color: #3f3f46;
      line-height: 1.6;
      font-size: 16px;
    }
    .email-body h2 {
      margin-top: 0;
      color: #18181b;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 24px;
    }
    .email-body p {
      margin-bottom: 20px;
    }
    .button-container {
      text-align: center;
      margin: 32px 0;
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: ${brandColor};
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      transition: background-color 0.2s;
    }
    .email-footer {
      padding: 30px 40px;
      background-color: #fafafa;
      text-align: center;
      color: #a1a1aa;
      font-size: 14px;
      border-top: 1px solid #e4e4e7;
    }
    .email-footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-content">
      <div class="email-header">
        <h1>UniTask</h1>
      </div>
      <div class="email-body">
        ${content}
      </div>
      <div class="email-footer">
        <p>&copy; ${new Date().getFullYear()} UniTask. All rights reserved.</p>
        <p>If you have any questions, please contact our support team.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const getWelcomeEmailTemplate = (name) => {
  const content = `
    <h2>Welcome to UniTask, ${name}!</h2>
    <p>We're absolutely thrilled to have you on board. UniTask is designed to help you organize your assignments, track priorities, and collaborate with your study groups effectively.</p>
    <p>To get started, simply log in and explore your new dashboard.</p>
    <div class="button-container">
      <a href="http://localhost:5173/login" class="button">Go to Dashboard</a>
    </div>
    <p>If you have any questions or need assistance, our support team is always here to help.</p>
  `;
  return baseTemplate("Welcome to UniTask!", content);
};

export const getPasswordResetTemplate = (resetUrl) => {
  const content = `
    <h2>Reset Your Password</h2>
    <p>We received a request to reset the password for your UniTask account. If you made this request, please click the button below to choose a new password:</p>
    <div class="button-container">
      <a href="${resetUrl}" clicktracking="off" class="button">Reset Password</a>
    </div>
    <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
    <p style="word-break: break-all; color: ${brandColor}; background-color: #f4f4f5; padding: 12px; border-radius: 6px; font-size: 14px;">${resetUrl}</p>
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
  `;
  return baseTemplate("Reset Your Password", content);
};

export const getPasswordResetSuccessTemplate = (name) => {
  const content = `
    <h2>Password Reset Successful</h2>
    <p>Hi ${name},</p>
    <p>Your UniTask password has been successfully updated. You can now use your new password to log in to your account.</p>
    <div class="button-container">
      <a href="http://localhost:5173/login" class="button">Log In Now</a>
    </div>
    <p>If you did not request this change, please contact our support team immediately to secure your account.</p>
  `;
  return baseTemplate("Your Password Has Been Reset", content);
};

export const getSkillsAnalysisReportTemplate = (name, analysis) => {
  const {
    overallProgress = 0,
    tasksCompleted = 0,
    totalTasks = 0,
    onTimeCompletion = {},
    lateSubmissions = {},
    consistencyLevel = "N/A",
    consistencyScore = 0,
    procrastinationBehavior = "N/A",
    skillsImprovement = {},
    suggestions = [],
  } = analysis;

  const onTimePercentage = onTimeCompletion.percentage || 0;
  const latePercentage = lateSubmissions.percentage || 0;

  // Determine progress color based on score
  const getProgressColor = (score) => {
    if (score >= 80) return "#10b981"; // green
    if (score >= 60) return "#f59e0b"; // amber
    return "#ef4444"; // red
  };

  const progressColor = getProgressColor(consistencyScore);

  const content = `
    <h2>Your Monthly Skills Analysis Report</h2>
    <p>Hi ${name},</p>
    <p>Here's your comprehensive skills analysis report for this month. This report highlights your progress, productivity patterns, and areas for improvement.</p>
    
    <h3 style="color: ${brandColor}; margin-top: 32px;">📊 Overall Performance</h3>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600;">Overall Progress</td>
          <td style="padding: 12px 0; text-align: right; color: ${brandColor}; font-weight: 700;">${overallProgress}%</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600;">Tasks Completed</td>
          <td style="padding: 12px 0; text-align: right;">${tasksCompleted} of ${totalTasks}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 0; font-weight: 600;">Consistency Score</td>
          <td style="padding: 12px 0; text-align: right; color: ${progressColor}; font-weight: 700;">${consistencyScore}/100</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; font-weight: 600;">Consistency Level</td>
          <td style="padding: 12px 0; text-align: right; font-weight: 600;">${consistencyLevel}</td>
        </tr>
      </table>
    </div>

    <h3 style="color: ${brandColor};">⏱️ Task Completion Patterns</h3>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px 0;"><strong>On-Time Completions:</strong> <span style="color: #10b981; font-weight: 700;">${onTimePercentage}%</span> (${onTimeCompletion.count || 0} tasks)</p>
      <p style="margin: 0;"><strong>Late Submissions:</strong> <span style="color: #ef4444; font-weight: 700;">${latePercentage}%</span> (${lateSubmissions.count || 0} tasks)</p>
    </div>

    <h3 style="color: ${brandColor};">🎯 Procrastination Analysis</h3>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <p style="margin: 0;"><strong>Procrastination Level:</strong> ${procrastinationBehavior}</p>
    </div>

    <h3 style="color: ${brandColor};">📚 Skills Development</h3>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      ${
        skillsImprovement.timeManagement
          ? `<p style="margin: 0 0 12px 0;"><strong>Time Management:</strong> ${skillsImprovement.timeManagement.level} (${skillsImprovement.timeManagement.score}/100)</p>`
          : ""
      }
      ${
        skillsImprovement.researchSkills
          ? `<p style="margin: 0 0 12px 0;"><strong>Research Skills:</strong> ${skillsImprovement.researchSkills.level} (${skillsImprovement.researchSkills.score}/100)</p>`
          : ""
      }
      ${
        skillsImprovement.technicalSkills
          ? `<p style="margin: 0 0 12px 0;"><strong>Technical Skills:</strong> ${skillsImprovement.technicalSkills.level} (${skillsImprovement.technicalSkills.score}/100)</p>`
          : ""
      }
      ${
        skillsImprovement.communicationSkills
          ? `<p style="margin: 0;"><strong>Communication Skills:</strong> ${skillsImprovement.communicationSkills.level} (${skillsImprovement.communicationSkills.score}/100)</p>`
          : ""
      }
    </div>

    ${
      suggestions && suggestions.length > 0
        ? `
    <h3 style="color: ${brandColor};">💡 Personalized Recommendations</h3>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      ${suggestions
        .map(
          (suggestion) => `
        <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0 0 8px 0;"><strong>${suggestion.title}</strong> <span style="color: ${
            suggestion.priority === "High"
              ? "#ef4444"
              : suggestion.priority === "Medium"
                ? "#f59e0b"
                : "#10b981"
          }; font-size: 12px; font-weight: 600;">[${suggestion.priority}]</span></p>
          <p style="margin: 0; color: #666; font-size: 14px;">${suggestion.description}</p>
        </div>
      `
        )
        .join("")}
    </div>
    `
        : ""
    }

    <p style="margin-top: 32px; color: #666; font-size: 14px;">
      Log in to your UniTask dashboard to view detailed analytics and track your progress over time.
    </p>
    <div class="button-container">
      <a href="http://localhost:5173/dashboard/skills-analysis" class="button">View Detailed Report</a>
    </div>
  `;
  return baseTemplate("Your Monthly Skills Analysis Report", content);
};

export const getMentionEmailTemplate = (name, mentionerName, taskTitle, groupName, groupLink) => {
  const content = `
    <h2>You were mentioned in a task</h2>
    <p>Hi ${name},</p>
    <p><strong>${mentionerName}</strong> mentioned you in a comment on the task <strong>"${taskTitle}"</strong> within the group <strong>"${groupName}"</strong>.</p>
    <div class="button-container">
      <a href="http://localhost:5173${groupLink}" class="button">View Task</a>
    </div>
    <p>Staying engaged with your group helps ensure projects stay on track!</p>
  `;
  return baseTemplate("New Mention in UniTask", content);
};

