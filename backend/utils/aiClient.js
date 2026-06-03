// Optional Claude enrichment layer. Mirrors the `cloudinary.js` / `mailer.js`
// pattern: everything gracefully no-ops (falls back to a deterministic result)
// when ANTHROPIC_API_KEY is missing or a call fails — so the demo never breaks.
//
// Hybrid design: the deterministic engine in `aiMatch.js` is always the source
// of truth for *scores*; Claude only enriches the *narrative* parts (fit
// analysis, interview questions, resume feedback, skill-gap advice).

const { computeMatch, matchSummary } = require('./aiMatch');

const MODEL = process.env.AI_MODEL || 'claude-haiku-4-5';
const isAIConfigured = () => !!process.env.ANTHROPIC_API_KEY;

let _client = null;
const getClient = () => {
  if (_client) return _client;
  const Anthropic = require('@anthropic-ai/sdk');
  _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
};

const SYSTEM = `You are PlaceIQ, an assistant inside a campus Training & Placement Cell platform.
You help students improve their fit for company placement drives.
Be concrete, encouraging and concise. When asked for JSON, reply with ONLY valid JSON — no markdown, no prose outside the JSON.`;

// Single chat helper. The static system prompt is marked for prompt caching so
// repeated calls in a session are cheaper/faster.
const ask = async (userPrompt, maxTokens = 700) => {
  const client = getClient();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: [
      { type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });
  return res.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
};

// Best-effort JSON extraction from a model reply.
const parseJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const startA = text.indexOf('[');
    const i =
      startA !== -1 && (start === -1 || startA < start) ? startA : start;
    const close = i === text.indexOf('[') ? text.lastIndexOf(']') : text.lastIndexOf('}');
    if (i !== -1 && close !== -1) {
      try {
        return JSON.parse(text.slice(i, close + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

// ---- 1) Fit analysis (narrative) -------------------------------------------
const analyzeFit = async (student, drive, match = computeMatch(student, drive)) => {
  const fallback = matchSummary(student, drive, match);
  if (!isAIConfigured()) return { analysis: fallback, ai: false };
  try {
    const prompt = `A student is considering applying to this placement drive.
Drive: ${drive.role} at ${drive.company} (${drive.type}). Required skills: ${(drive.requiredSkills || []).join(', ') || 'none listed'}. Min CGPA: ${drive.minCgpa || 0}.
Student: branch ${student.branch || 'N/A'}, CGPA ${student.cgpa || 'N/A'}, skills: ${(student.skills || []).join(', ') || 'none listed'}.
Computed match score: ${match.score}/100 (matched: ${match.skillsMatched.join(', ') || 'none'}; missing: ${match.skillsMissing.join(', ') || 'none'}).
In 3-4 sentences, give an honest, encouraging assessment of their fit and the single most valuable thing to improve.`;
    const analysis = await ask(prompt, 400);
    return { analysis: analysis || fallback, ai: !!analysis };
  } catch (err) {
    console.error('AI analyzeFit failed:', err.message);
    return { analysis: fallback, ai: false };
  }
};

// ---- 2) Interview prep ------------------------------------------------------
const fallbackInterview = (drive) => {
  const skills = (drive.requiredSkills || []).slice(0, 5);
  const questions = [
    `Walk me through a project where you used ${skills[0] || 'a relevant technology'}.`,
    ...skills.slice(1).map((s) => `What do you understand about ${s}, and where have you applied it?`),
    `Why do you want to join ${drive.company} as a ${drive.role}?`,
    'Tell me about a challenging bug or problem you solved and how.',
  ];
  const tips = [
    'Revise the core fundamentals behind each required skill.',
    'Prepare one STAR-format story per project on your resume.',
    `Research ${drive.company}'s products and recent news.`,
  ];
  return { questions, tips };
};

const interviewPrep = async (drive, student) => {
  const fallback = fallbackInterview(drive);
  if (!isAIConfigured()) return { ...fallback, ai: false };
  try {
    const prompt = `Generate interview prep for a student applying to ${drive.role} at ${drive.company}.
Required skills: ${(drive.requiredSkills || []).join(', ') || 'general'}.
Student skills: ${(student.skills || []).join(', ') || 'N/A'}.
Reply as JSON: {"questions": [6 likely interview questions as strings], "tips": [3 short prep tips as strings]}.`;
    const data = parseJSON(await ask(prompt, 700));
    if (data && Array.isArray(data.questions)) {
      return {
        questions: data.questions,
        tips: Array.isArray(data.tips) ? data.tips : fallback.tips,
        ai: true,
      };
    }
    return { ...fallback, ai: false };
  } catch (err) {
    console.error('AI interviewPrep failed:', err.message);
    return { ...fallback, ai: false };
  }
};

// ---- 3) Resume feedback -----------------------------------------------------
const fallbackResume = () => ({
  suggestions: [
    'Lead each bullet with a strong action verb and a measurable result.',
    'Put your most relevant skills and projects near the top.',
    'Quantify impact (numbers, %, scale) wherever possible.',
    'Keep it to one page and fix any inconsistent formatting.',
    'Tailor the skills section to the specific role you are targeting.',
  ],
});

const resumeFeedback = async (resumeText, targetRole = '') => {
  const fallback = fallbackResume();
  if (!isAIConfigured() || !resumeText) return { ...fallback, ai: false };
  try {
    const prompt = `Review this student resume${targetRole ? ` for a ${targetRole} role` : ''} and give specific, actionable improvement suggestions.
Resume:
"""
${resumeText.slice(0, 4000)}
"""
Reply as JSON: {"suggestions": [5-7 concrete suggestions as strings]}.`;
    const data = parseJSON(await ask(prompt, 700));
    if (data && Array.isArray(data.suggestions) && data.suggestions.length) {
      return { suggestions: data.suggestions, ai: true };
    }
    return { ...fallback, ai: false };
  } catch (err) {
    console.error('AI resumeFeedback failed:', err.message);
    return { ...fallback, ai: false };
  }
};

// ---- 4) Skill-gap advice ----------------------------------------------------
const skillGapAdvice = async (missingSkills = [], role = '') => {
  const fallback =
    missingSkills.length
      ? `Focus next on: ${missingSkills.join(', ')}. Build a small project for each and add it to your resume.`
      : `You already cover the required skills — keep them sharp and deepen one to an advanced level.`;
  if (!isAIConfigured() || !missingSkills.length) {
    return { advice: fallback, ai: false };
  }
  try {
    const prompt = `A student targeting a ${role || 'tech'} role is missing these skills: ${missingSkills.join(', ')}.
In 2-3 sentences, advise what to learn first and a concrete way to practise each. Be specific and motivating.`;
    const advice = await ask(prompt, 300);
    return { advice: advice || fallback, ai: !!advice };
  } catch (err) {
    console.error('AI skillGapAdvice failed:', err.message);
    return { advice: fallback, ai: false };
  }
};

module.exports = {
  isAIConfigured,
  analyzeFit,
  interviewPrep,
  resumeFeedback,
  skillGapAdvice,
};
