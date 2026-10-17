// FILE: backend/controllers/aiGroupController.js
import Group from '../models/Group.js';
import GroupTask from '../models/GroupTask.js';
import Contribution from '../models/Contribution.js';
import axios from 'axios';

/**
 * AI Group Health Report
 */
export const getGroupHealthReport = async (req, res) => {
  try {
    const groupId = req.params.id;

    // STEP 1 — Verify user is a group member
    const group = await Group.findById(groupId).populate('members.user', 'name email');
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isMember = group.members.some(m => m.user?._id.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Access denied. Members only.' });

    // STEP 2 — Fetch all GroupTasks for this group
    const tasks = await GroupTask.find({ group: groupId }).populate('assignedTo', 'name');

    // STEP 3 — Compute statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'To-Do').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const now = new Date();
    const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Done');
    const overdueList = overdueTasks.map(t => `"${t.title}" (assigned to: ${t.assignedTo?.name || 'Unassigned'})`).join(', ');

    const highPriorityPending = tasks.filter(t => t.priority === 'High' && t.status !== 'Done').map(t => `"${t.title}"`).join(', ');

    // STEP 4 — Fetch Contribution scores
    const contributions = await Contribution.find({ group: groupId }).populate('user', 'name');
    const memberScores = contributions.map(c => ({
      name: c.user?.name || 'Unknown',
      score: c.score,
      activityCount: c.activities?.length || 0
    }));

    const zeroContributors = memberScores.filter(m => m.score === 0).map(m => m.name).join(', ');
    const totalMembers = group.members.length;
    const activeMembers = memberScores.filter(m => m.score > 0).length;

    // STEP 5 — Build context string for AI
    const contextSummary = `
      Group Name: ${group.name}
      Total Members: ${totalMembers}
      Active Members (with contributions): ${activeMembers}
      Members with zero contributions: ${zeroContributors || 'None'}

      Task Summary:
      - Total Tasks: ${totalTasks}
      - Completed: ${completedTasks} (${completionRate}%)
      - In Progress: ${inProgressTasks}
      - Pending (To-Do): ${pendingTasks}
      - Overdue Tasks: ${overdueTasks.length} — ${overdueList || 'None'}
      - High Priority Pending: ${highPriorityPending || 'None'}

      Member Contribution Scores:
      ${memberScores.map(m => `${m.name}: ${m.score} points, ${m.activityCount} activities`).join('\n')}
    `;

    // STEP 6 — AI Call
    const prompt = `
      You are an academic project coach analyzing a university student group's progress. Based on the data below, generate a structured group health report with exactly these 4 sections:

      1. OVERALL STATUS: One sentence summary with a status label of either ON TRACK, AT RISK, or CRITICAL based on completion rate and overdue tasks.

      2. KEY WARNINGS: List up to 3 specific warnings based on the data (overdue tasks, zero contributors, low completion rate). If no warnings, say "No major issues detected."

      3. STRENGTHS: List up to 2 positive observations from the data.

      4. RECOMMENDATIONS: Give exactly 3 specific, actionable recommendations for this group to improve.

      Keep the entire response under 250 words.
      Use plain text only — no markdown, no asterisks, no hashtags.
      Use numbered lists for warnings and recommendations.

      Group Data:
      ${contextSummary}
    `;

    let aiResponseText = "";
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
          max_tokens: 1000
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      aiResponseText = response.data.choices[0].message.content;
    } catch (aiError) {
      console.error("AI Analysis Error:", aiError.message);
      aiResponseText = `AI analysis unavailable. Based on the data: Completion rate is ${completionRate}%. ${overdueTasks.length} tasks are overdue. ${activeMembers} of ${totalMembers} members are actively contributing. Review task assignments and deadlines.`;
    }

    // STEP 7 — Return computed stats alongside AI text
    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingTasks,
          completionRate,
          overdueCount: overdueTasks.length,
          totalMembers,
          activeMembers,
          zeroContributors: zeroContributors || null,
          memberScores
        },
        report: aiResponseText
      }
    });

  } catch (error) {
    console.error("Health Report Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * AI Task Distributor
 */
export const distributeTasksWithAI = async (req, res) => {
  try {
    const groupId = req.params.id;

    // STEP 1 — Verify user is admin
    const group = await Group.findById(groupId).populate('members.user', 'name email');
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const userMember = group.members.find(m => m.user?._id.toString() === req.user.id);
    if (!userMember || userMember.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only group admin can use AI task distribution' });
    }

    // STEP 2 — Get request body
    const { assignmentTitle, assignmentDescription } = req.body;
    if (!assignmentTitle || !assignmentDescription || assignmentDescription.length < 20) {
      return res.status(400).json({ success: false, message: 'Project Title and a descriptive Description (min 20 chars) are required.' });
    }

    // STEP 3 — Fetch contribution data
    const contributions = await Contribution.find({ group: groupId }).populate('user', 'name email');
    const memberProfiles = group.members.map(member => {
      const contribution = contributions.find(c => c.user?._id.toString() === member.user?._id.toString());
      const recentActivities = contribution?.activities?.slice(-10)?.map(a => a.action) || [];
      const taskKeywords = recentActivities.join(' ').toLowerCase();
      
      const skills = [];
      if (taskKeywords.includes('backend') || taskKeywords.includes('api') || taskKeywords.includes('server')) skills.push('backend development');
      if (taskKeywords.includes('frontend') || taskKeywords.includes('ui') || taskKeywords.includes('react')) skills.push('frontend development');
      if (taskKeywords.includes('database') || taskKeywords.includes('query') || taskKeywords.includes('schema')) skills.push('database management');
      if (taskKeywords.includes('report') || taskKeywords.includes('document') || taskKeywords.includes('write')) skills.push('documentation');
      if (taskKeywords.includes('test') || taskKeywords.includes('debug') || taskKeywords.includes('fix')) skills.push('testing and debugging');
      if (skills.length === 0) skills.push('general tasks');

      return {
        id: member.user?._id,
        name: member.user?.name,
        role: member.role,
        contributionScore: contribution?.score || 0,
        totalActivities: contribution?.activities?.length || 0,
        detectedSkills: skills,
        recentWork: recentActivities.slice(0, 5)
      };
    });

    const memberSummary = memberProfiles.map(m => `
      - ID: ${m.id}
      - Name: ${m.name} (${m.role})
        Contribution: ${m.contributionScore} pts
        Detected Skills: ${m.detectedSkills.join(', ')}
        Recent Work: ${m.recentWork.join('; ') || 'No data'}
    `).join('\n');

    const prompt = `
      As an AI Project Architect, analyze this project and break it down into 4–6 professional tasks.
      
      Project: ${assignmentTitle}
      Requirements: ${assignmentDescription}
      
      GROUP MEMBERS:
      ${memberSummary}
      
      INSTRUCTIONS:
      1. Create a professional task breakdown for this project.
      2. For each task, generate:
         - A clear, action-oriented title.
         - A professional description.
         - A checklist (sub-tasks array) of 3–5 specific sub-items to complete the task.
      3. Assign each task to the most suitable group member based on their IDs and detected skills.
      4. Balance the distribution among all members as fairly as possible.
      
      Return results ONLY in this JSON format:
      {
        "assignments": [
          {
            "taskTitle": "Clear, professional task title",
            "taskDescription": "Detailed 1-2 sentence description",
            "userId": "The exact ID of the member assigned",
            "memberName": "The name of the member assigned",
            "checklist": ["Item 1", "Item 2", "Item 3"],
            "reasoning": "Quick logic for this assignment"
          }
        ],
        "summary": "Overall project strategy summary"
      }
    `;

    // STEP 5 & 6 — Call AI & Parse Result
    let parsedResult;
    try {
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );
      const aiResponse = response.data.choices[0].message.content;
      parsedResult = JSON.parse(aiResponse.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (aiError) {
      console.error("AI Distribution Error:", aiError.message);
      // Fallback: Round robin
      parsedResult = {
        assignments: subtasks.map((s, i) => {
          const m = group.members[i % group.members.length];
          return {
            subtask: s,
            userId: m.user._id,
            memberName: m.user.name,
            reason: 'Assigned via round-robin due to AI downtime'
          };
        }),
        summary: 'AI analysis unavailable. Tasks distributed evenly.'
      };
    }

    // STEP 7 — Return result
    return res.status(200).json({
      success: true,
      data: {
        assignments: parsedResult.assignments,
        summary: parsedResult.summary,
        memberProfiles: memberProfiles.map(m => ({
          name: m.name,
          score: m.contributionScore,
          skills: m.detectedSkills
        }))
      }
    });

  } catch (error) {
    console.error("Distributor Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * AI Task Prioritization (Stub)
 */
export const prioritizeTasks = async (req, res) => {
  try {
    const groupId = req.params.id;
    // For now, return success as a stub to prevent server crash
    res.status(200).json({ 
      success: true, 
      message: "Tasks smart-prioritized by AI (placeholder)" 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
