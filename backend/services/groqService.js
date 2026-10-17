import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export const generateBreakdown = async (description, workHoursPerDay = 4) => {
  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an expert academic planning assistant with deep knowledge of university coursework across disciplines (CS, engineering, humanities, sciences, business).

Your job is to analyze an assignment description and produce a realistic, structured breakdown a student can actually follow.

## Thinking Process (do this mentally before outputting):
1. Identify the assignment TYPE (essay, coding project, lab report, presentation, research paper, etc.)
2. Identify the COURSE DOMAIN if possible
3. Estimate realistic scope based on typical university standards
4. Break into phases: understand → research/gather → execute → review/submit

## Time Estimation Guidelines (per assignment type):
- **Essays/Reports**: Outline (1h), research per source (30-45min), writing per page (45-90min), editing (1h per 5 pages)
- **Coding Projects**: Setup/architecture (1-2h), per feature (1-4h depending on complexity), testing (20% of coding time), documentation (1h)
- **Presentations**: Research (2-4h), slide creation (1h per 3-4 slides), rehearsal (1-2h)
- **Lab Reports**: Pre-lab (1h), experiment (as scheduled), data analysis (1-2h), writing (2-4h)
- **Math/Problem Sets**: Per problem, Easy (10-15min), Medium (20-40min), Hard (45-90min)

## Difficulty Level Definitions:
- **Easy**: Requires recall or straightforward application of known concepts. Low ambiguity.
- **Medium**: Requires synthesis, analysis, or moderate problem-solving. Some ambiguity.
- **Hard**: Requires original thinking, debugging, deep research, or multi-step reasoning under uncertainty.

## Rules:
- Assume the student works ${workHoursPerDay} focused hours per day
- Subtasks must be sequential and specific (bad: "Do research" → good: "Find 4 peer-reviewed papers on neural plasticity using Google Scholar")
- Never include vague subtasks like "Finalize" or "Work on assignment"
- Total hours = sum of all subtask hours (be honest, not optimistic)
- realisticDays = Math.ceil(totalEstimatedHours / ${workHoursPerDay})
- Generate 4-10 subtasks depending on assignment complexity
- Return ONLY a valid JSON object. No markdown, no prose, no code fences.`,
          },
          {
            role: "user",
            content: `Analyze this assignment and return a JSON breakdown:

INPUT:
"""
${description}
"""

REQUIRED JSON FORMAT:
{
  "title": "Specific assignment title (e.g., 'Binary Search Tree Implementation in Java')",
  "course": "Best guess at course name/code (e.g., 'Data Structures CS201'), or 'General' if unknown",
  "aiDescription": "2-3 sentence summary of what the assignment requires, the main challenges, and what a successful submission looks like",
  "deadline": "YYYY-MM-DD if a date is mentioned, otherwise empty string",
  "totalEstimatedHours": <sum of all subtask hours as a number>,
  "realisticDays": <Math.ceil(totalEstimatedHours / ${workHoursPerDay}) as a number>,
  "subtasks": [
    {
      "title": "Verb-first, specific action (e.g., 'Implement insert() and delete() methods')",
      "subDescription": "What exactly to do and what 'done' looks like for this step",
      "estimatedHours": <realistic number, decimals allowed e.g. 1.5>,
      "difficultyLevel": "Easy | Medium | Hard"
    }
  ]
}

EXAMPLE of a good subtask (for reference):
{
  "title": "Research 5 peer-reviewed sources on climate migration",
  "subDescription": "Use Google Scholar and JSTOR. Focus on sources from 2018-2024. Save citations in APA format in a doc.",
  "estimatedHours": 2.5,
  "difficultyLevel": "Medium"
}`,
          },
        ],
        temperature: 0.2, // Lower = more deterministic & consistent
        response_format: { type: "json_object" },
        max_tokens: 1500,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const content = response.data.choices[0].message.content;

    // Strip markdown fences (defensive, even with json_object mode)
    const cleanContent = content
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanContent);

    // Structural validation
    if (
      !parsed.title ||
      !Array.isArray(parsed.subtasks) ||
      parsed.subtasks.length === 0
    ) {
      throw new Error("Invalid AI response: missing title or subtasks");
    }

    // Data integrity fixes
    parsed.totalEstimatedHours = parsed.subtasks.reduce(
      (sum, t) => sum + (parseFloat(t.estimatedHours) || 0),
      0,
    );
    parsed.realisticDays = Math.ceil(
      parsed.totalEstimatedHours / workHoursPerDay,
    );

    // Normalize each subtask
    parsed.subtasks = parsed.subtasks.map((task, i) => ({
      title: task.title || `Step ${i + 1}`,
      subDescription: task.subDescription || "",
      estimatedHours: parseFloat(task.estimatedHours) || 1,
      difficultyLevel: ["Easy", "Medium", "Hard"].includes(task.difficultyLevel)
        ? task.difficultyLevel
        : "Medium",
    }));

    return parsed;
  } catch (error) {
    const errorData = error.response?.data || {};
    const errorMsg = errorData.error?.message || error.message;

    if (errorMsg.includes("authorization grant") || errorMsg.includes("invalid_grant")) {
      console.error("❌ Groq Auth Error: The provided API key is invalid or has expired. Please check your .env file.");
    } else {
      console.error("❌ Groq Error:", errorData || error.message);
    }

    throw new Error(errorMsg || "AI Breakdown Failed");
  }
};

// NEW: Function to parse calendar constraints
export const parseConstraints = async (constraintsText, startDate, endDate) => {
  if (!constraintsText || constraintsText.trim() === "") return [];

  try {
    const response = await axios.post(
      //
      "https://api.groq.com/openai/v1/chat/completions", //
      {
        model: "llama-3.3-70b-versatile", //
        messages: [
          {
            role: "system",
            content: `You are a date calculation assistant for a student's study planner.
Your job is to identify specific dates the user DOES NOT want to study based on their constraints.
Return ONLY a valid JSON object with no markdown, no explanations, no code blocks.`, //
          },
          {
            role: "user",
            content: `Start Date: ${startDate.toDateString()}.
Deadline: ${endDate.toDateString()}.
User Constraints: "${constraintsText}"

Return the response in this exact JSON format:
{
  "excludedDates": ["YYYY-MM-DD", "YYYY-MM-DD"]
}
If no dates should be excluded, return { "excludedDates": [] }.`,
          },
        ],
        temperature: 0.1, // Low temperature for factual date parsing
        response_format: { type: "json_object" }, //
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`, //
          "Content-Type": "application/json", //
        },
      },
    );

    const content = response.data.choices[0].message.content; //

    // Clean up any stray markdown just in case
    const cleanContent = content
      .replace(/```json\n?/g, "") //
      .replace(/```\n?/g, "") //
      .trim(); //

    const parsed = JSON.parse(cleanContent); //

    if (!parsed.excludedDates || !Array.isArray(parsed.excludedDates)) {
      throw new Error("Invalid AI response structure"); //
    }

    // Convert strings to standard DateString formats for easier matching in the controller
    return parsed.excludedDates.map((dateStr) =>
      new Date(dateStr).toDateString(),
    );
  } catch (error) {
    console.error(
      "❌ Groq Constraints Error:",
      error.response?.data || error.message,
    ); //
    return []; // Fail gracefully, returning no excluded dates so scheduling doesn't break
  }
};
