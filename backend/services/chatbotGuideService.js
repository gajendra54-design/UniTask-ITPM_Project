/**
 * AI Assignment Chatbot Guidance Service
 * Provides intelligent responses for guiding users on assignment analysis
 */

const guidanceTopics = {
  howToAnalyze: {
    keywords: ["how to analyze", "analyze assignment", "how analyze"],
    response: `📊 To analyze assignments effectively:

1. **Check Priority**: Look at the priority badge (Critical, High, Medium, Low)
2. **Review Deadline**: The date badge shows when it's due
3. **Track Progress**: The progress bar shows completion percentage
4. **Break It Down**: Click on an assignment to see subtasks
5. **Estimate Time**: Check total hours estimated for planning

Priority is calculated from urgency, importance, and workload. Click an assignment card to see full details!`,
  },
  priority: {
    keywords: ["priority", "prioritize", "important", "urgent"],
    response: `🎯 Understanding Priority:

• **Critical (Red)**: Score ≥85 - Do immediately!
• **High (Orange)**: Score 65-84 - Schedule soon
• **Medium (Yellow)**: Score 45-64 - Plan ahead
• **Low (Green)**: Score <45 - Flexible timing

Priority is calculated using:
  - Urgency (deadline proximity): 50%
  - Importance (task impact): 30%
  - Workload (realistic time): 20%

Focus on Critical tasks first!`,
  },
  subtask: {
    keywords: ["subtask", "sub-task", "breakdown", "break down"],
    response: `✅ About Subtasks:

Subtasks help break down large assignments into manageable pieces:
• Each subtask can be marked as complete
• Shows estimated hours per subtask
• Progress bar reflects overall completion
• Click an assignment card to expand and manage subtasks
• Check off tasks as you complete them

💡 Pro Tip: Smaller tasks = better tracking and faster completion!`,
  },
  deadline: {
    keywords: ["deadline", "due date", "due soon", "overdue"],
    response: `📅 Deadline Management:

• **Red Badge** = Overdue (past deadline) - ACT NOW!
• **Blue Badge** = In Progress (upcoming deadline)
• **Dates** show month and day format
• Plan work based on urgency!

💡 Tip: Assignments with nearby deadlines automatically get higher priority scores. Check the workload analysis to avoid overloading yourself!`,
  },
  progress: {
    keywords: ["progress", "completion", "track progress", "how many"],
    response: `📈 Tracking Progress:

• **Progress Bar** shows % complete
• Based on subtasks finished
• Visual indicator of workload
• Check regularly to stay motivated!

How it works:
  - Mark subtasks as complete
  - Progress bar updates automatically
  - Completion % = (Completed / Total Subtasks) × 100

💡 Completing subtasks boosts motivation and reduces stress!`,
  },
  addAssignment: {
    keywords: ["add assignment", "create assignment", "new assignment", "add new"],
    response: `➕ Adding New Assignments:

Step-by-step guide:
1. Click the **'+ Add Assignment'** button (top right)
2. Describe your assignment in detail
3. Click **'✨ AI Breakdown'** button
4. AI generates:
   - Suggested title & course
   - Estimated total hours
   - Realistic days to completion
   - Automatic subtask breakdown
5. Review and edit if needed
6. Click **'Save Assignment'** to create

The AI helps estimate time realistically and creates logical subtasks automatically!`,
  },
  workload: {
    keywords: ["workload", "workload analysis", "daily workload", "overload"],
    response: `💼 Workload Management:

Understanding your workload:
• Check daily workload distribution
• See hours assigned to each day
• Identify overloaded days
• Redistribute tasks as needed

💡 Best Practices:
- Spread tasks evenly across days
- Avoid days with >8 hours of work
- Plan buffer time for unexpected issues
- Use calendar view for visual planning`,
  },
  tips: {
    keywords: ["tip", "tips", "help", "advice", "best practice"],
    response: `💡 Pro Tips for Assignment Management:

✓ Break large tasks into smaller subtasks
✓ Always estimate time realistically
✓ Check deadline dates regularly  
✓ Complete high-priority tasks first
✓ Update progress as you work
✓ Use the calendar for planning
✓ Review workload distribution
✓ Set reminders for upcoming deadlines
✓ Mark subtasks as done for motivation
✓ Adjust estimates based on actual time

💪 Remember: Small progress is still progress!`,
  },
};

/**
 * Find matching guidance topic based on user input
 * @param {string} userMessage - User message to analyze
 * @returns {object} Topic info with response
 */
const findMatchingTopic = (userMessage) => {
  const messageLower = userMessage.toLowerCase();

  for (const [key, topic] of Object.entries(guidanceTopics)) {
    for (const keyword of topic.keywords) {
      if (messageLower.includes(keyword)) {
        return topic;
      }
    }
  }

  return null;
};

/**
 * Get guidance response for user message
 * @param {string} userMessage - User's message
 * @returns {string} Guidance response
 */
export const getGuidanceResponse = (userMessage) => {
  if (!userMessage || userMessage.trim() === "") {
    return `I can help you with assignment analysis! Ask me about:
• How to analyze assignments
• Understanding priority levels
• Managing subtasks
• Tracking deadlines
• Monitoring progress
• Adding new assignments
• Pro tips & best practices

What would you like to know? 😊`;
  }

  const matchedTopic = findMatchingTopic(userMessage);

  if (matchedTopic) {
    return matchedTopic.response;
  }

  return `I can help you with assignment-related questions! Try asking about:
• How to analyze assignments
• Understanding priority levels
• Managing subtasks
• Tracking deadlines
• Monitoring progress
• Adding new assignments
• Pro tips & best practices

Or ask me your specific question! 😊`;
};

/**
 * Get all available topics
 * @returns {array} List of available guidance topics
 */
export const getAvailableTopics = () => {
  return Object.keys(guidanceTopics).map((key) => ({
    id: key,
    keywords: guidanceTopics[key].keywords,
  }));
};

export default {
  getGuidanceResponse,
  getAvailableTopics,
  guidanceTopics,
};
