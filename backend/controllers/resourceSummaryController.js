// FILE: backend/controllers/resourceSummaryController.js
import Group from '../models/Group.js';
import Resource from '../models/Resource.js';
import { generateBreakdown } from '../services/groqService.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ─── Internal fallback helper ───────────────────────────────────────────────
function generateFallbackSummary(resource) {
  const tags = resource.tags?.join(', ') || 'general topics';
  const type = resource.type === 'file' ? 'document' : 'link';
  return (
    `This ${type} covers ${tags}. ` +
    `It was shared to support group collaboration ` +
    `and may contain relevant study materials. ` +
    `Review it to determine its specific usefulness ` +
    `for your current tasks.`
  );
}

// ─── Internal AI caller (mirrors groqService pattern exactly) ───────────────
async function callGroqForSummary(prompt) {
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful academic resource assistant for a university student study group. ' +
            'Always respond in plain paragraph form — no bullet points, no numbered lists, no markdown.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 200
    },
    {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const content = response.data.choices[0].message.content;
  return content.trim();
}

// ─── Controller ─────────────────────────────────────────────────────────────
export const generateResourceSummary = async (req, res) => {
  try {
    // STEP 1 — Verify group exists and user is a member
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found' });
    }

    const isMember = group.members.some(
      (m) => m.user.toString() === req.user.id
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only group members can summarize resources'
      });
    }

    // STEP 2 — Fetch the resource
    const resource = await Resource.findOne({
      _id: req.params.resourceId,
      group: req.params.id
    });
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }

    // STEP 3 — Return cached summary if recent (< 24 hours)
    if (
      resource.aiSummary?.status === 'generated' &&
      resource.aiSummary?.generatedAt
    ) {
      const ageMs = Date.now() - new Date(resource.aiSummary.generatedAt).getTime();
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;
      if (ageMs < twentyFourHoursMs) {
        return res.status(200).json({
          success: true,
          data: {
            summary: resource.aiSummary.text,
            generatedAt: resource.aiSummary.generatedAt,
            cached: true
          }
        });
      }
    }

    // STEP 4 — Mark as pending
    await Resource.findByIdAndUpdate(resource._id, {
      'aiSummary.status': 'pending'
    });

    // STEP 5 — Build context string based on resource type
    let context;
    let typeNote;

    if (resource.type === 'link') {
      context = `
        Resource Type: External Link
        Title: ${resource.title}
        URL: ${resource.url}
        Description: ${resource.description || 'No description provided'}
        Tags: ${resource.tags?.join(', ') || 'No tags'}
      `;
      typeNote = `This is an external web link or URL. Based on the URL domain, title, and description, infer what kind of content this link likely contains.`;
    } else {
      context = `
        Resource Type: Uploaded File
        File Name: ${resource.originalName || resource.title}
        Title: ${resource.title}
        Description: ${resource.description || 'No description provided'}
        Tags: ${resource.tags?.join(', ') || 'No tags'}
      `;
      typeNote = `This is an uploaded file (PDF, doc, etc). Based on the filename, title, and tags, infer what this file likely contains. Do not claim to have read the file — base your summary on the available metadata.`;
    }

    // STEP 6 — Build AI prompt
    const prompt = `
      You are a helpful academic resource assistant for a university student study group.

      ${typeNote}

      Your task is to write a 3-sentence summary of this resource so group members can quickly decide if it is relevant to their work.

      Rules:
      - Sentence 1: Describe what this resource is about in simple, clear language.
      - Sentence 2: List 2-3 specific topics, concepts, or techniques this resource covers.
      - Sentence 3: State which type of academic task this resource is most useful for (e.g. research, coding, report writing, studying, presentation preparation).
      - Keep the total response under 80 words.
      - Do not use bullet points or numbered lists.
      - Write in plain paragraph form only.
      - Do not start with "This resource" — vary your opening.
      - If you cannot determine the content from metadata, write a helpful general summary based on the title and tags only.

      Resource Details:
      ${context}
    `;

    // STEP 7 — Call Groq AI
    let summaryText;
    try {
      summaryText = await callGroqForSummary(prompt);
    } catch (aiError) {
      // Groq-specific failure → save fallback and return 200
      await Resource.findByIdAndUpdate(resource._id, {
        'aiSummary.status': 'failed'
      });
      return res.status(200).json({
        success: true,
        data: {
          summary: generateFallbackSummary(resource),
          generatedAt: new Date(),
          cached: false,
          fallback: true
        }
      });
    }

    // STEP 8 — Save generated summary
    const updatedResource = await Resource.findByIdAndUpdate(
      resource._id,
      {
        'aiSummary.text': summaryText.trim(),
        'aiSummary.generatedAt': new Date(),
        'aiSummary.status': 'generated'
      },
      { returnDocument: 'after' }
    );

    // STEP 9 — Return response
    return res.status(200).json({
      success: true,
      data: {
        summary: updatedResource.aiSummary.text,
        generatedAt: updatedResource.aiSummary.generatedAt,
        cached: false
      }
    });
  } catch (error) {
    // STEP 10 — Outer catch (DB or unexpected errors)
    return res.status(500).json({ success: false, message: error.message });
  }
};
