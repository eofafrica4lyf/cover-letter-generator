/**
 * Multi-stage cover letter pipeline: requirement extraction → evidence mapping → letter generation → validation.
 * Uses only the existing OpenAI SDK; no new infrastructure or extra dependencies.
 */

import OpenAI from 'openai';
import { z } from 'zod';

// --- Types (pipeline-internal) ---

const RequirementSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  label: z.string(),
  clarification: z.string().optional(),
  priorityOrder: z.number(),
});

const RequirementsOutputSchema = z.object({
  requirements: z.array(RequirementSchema),
});

type RequirementItem = z.infer<typeof RequirementSchema>;

const EvidenceMapItemSchema = z.object({
  requirementId: z.union([z.string(), z.number()]).transform(String),
  requirementLabel: z.string(),
  evidenceText: z.string(),
  sourceType: z.enum(['work', 'project', 'education', 'skill', 'none']),
  sourceName: z.string(),
});

const EvidenceMapOutputSchema = z.object({
  items: z.array(EvidenceMapItemSchema),
});

type EvidenceMapItem = z.infer<typeof EvidenceMapItemSchema>;

const ValidationOutputSchema = z.object({
  valid: z.boolean(),
  violations: z.array(z.string()).optional(),
});

type ValidationResult = z.infer<typeof ValidationOutputSchema>;

// Request shape matches existing API
export interface PipelineInput {
  jobPosting: {
    jobTitle: string;
    companyName: string;
    positionType: string;
    description: string;
    requirements: string[];
    language: string;
    hiringManager?: string;
    companyAddress?: string;
    department?: string;
  };
  userProfile: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    skills?: string[];
    workExperience?: Array<{ title: string; company: string; startDate: string; endDate?: string | null; isOngoing?: boolean; description: string }>;
    education?: Array<{ degree: string; institution: string; graduationDate: string; isOngoing?: boolean }>;
    projects?: Array<{ title: string; description: string; completionDate?: string; isOngoing?: boolean }>;
    academicContext?: {
      currentDegree?: string;
      university?: string;
      expectedGraduation?: string;
      relevantCoursework?: string[];
      gpa?: string;
    };
  };
  language: string;
  tone: 'professional' | 'enthusiastic' | 'formal';
  additionalNotes?: string;
  additionalInfo?: Record<string, string>;
  sampleLetter?: string;
}

export interface PipelineOutput {
  content: string;
  language: string;
  evidenceMap?: EvidenceMapItem[];
  validation?: ValidationResult;
}

function profileToText(profile: PipelineInput['userProfile']): string {
  let s = `Name: ${profile.name}\nEmail: ${profile.email}\nPhone: ${profile.phone ?? ''}\nLocation: ${profile.location ?? ''}\n`;
  if (profile.skills?.length) s += `\nSkills: ${profile.skills.join(', ')}\n`;
  if (profile.workExperience?.length) {
    s += '\nWORK EXPERIENCE:\n';
    profile.workExperience.forEach((exp, i) => {
      const end = exp.isOngoing ? 'Present' : (exp.endDate ?? 'Present');
      s += `${i + 1}. ${exp.title} at ${exp.company} (${exp.startDate} - ${end})\n   ${exp.description}\n`;
    });
  }
  if (profile.education?.length) {
    s += '\nEDUCATION:\n';
    profile.education.forEach((edu, i) => {
      s += `${i + 1}. ${edu.degree} at ${edu.institution} (${edu.graduationDate})\n`;
    });
  }
  if (profile.projects?.length) {
    s += '\nPROJECTS:\n';
    profile.projects.forEach((p, i) => {
      s += `${i + 1}. ${p.title}\n   ${p.description}\n`;
    });
  }
  if (profile.academicContext) {
    const ac = profile.academicContext;
    s += `\nACADEMIC: ${ac.currentDegree ?? ''} at ${ac.university ?? ''}, expected ${ac.expectedGraduation ?? ''}`;
    if (ac.relevantCoursework?.length) s += `; coursework: ${ac.relevantCoursework.join(', ')}`;
    s += '\n';
  }
  return s;
}

function jobToShortSummary(job: PipelineInput['jobPosting']): string {
  let s = `Company: ${job.companyName}\nPosition: ${job.jobTitle}\nType: ${job.positionType}\nLanguage: ${job.language}`;
  if (job.companyAddress) s += `\nCompany address: ${job.companyAddress}`;
  return s;
}

function candidateContactBlock(profile: PipelineInput['userProfile']): string {
  const lines: string[] = [
    `Name: ${profile.name}`,
    `Email: ${profile.email}`,
  ];
  if (profile.phone) lines.push(`Phone: ${profile.phone}`);
  if (profile.location) lines.push(`Address/Location: ${profile.location}`);
  return lines.join('\n');
}

async function chat(
  openai: OpenAI,
  model: string,
  system: string,
  user: string,
  options?: { max_tokens?: number; temperature?: number }
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    temperature: options?.temperature ?? 0.2,
    max_tokens: options?.max_tokens ?? 1000,
  });
  const content = completion.choices[0]?.message?.content;
  return (content ?? '').trim();
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = codeBlock ? codeBlock[1].trim() : trimmed;
  return JSON.parse(raw) as unknown;
}

/** Stage 1: Extract ordered requirements from the job posting. */
async function stage1ExtractRequirements(
  openai: OpenAI,
  jobPosting: PipelineInput['jobPosting']
): Promise<RequirementItem[]> {
  const system = `Extract key requirements from the job posting. Preserve the order they appear (use priorityOrder 1, 2, 3...). For each: short label (e.g. "C++", "Python", "team leadership"), optional clarification. Output JSON only, no markdown: { "requirements": [ { "id": "1", "label": "...", "clarification": "..." or omit, "priorityOrder": 1 }, ... ] }.`;

  const user = `Job posting:\nCompany: ${jobPosting.companyName}\nTitle: ${jobPosting.jobTitle}\nType: ${jobPosting.positionType}\n\nDescription:\n${jobPosting.description}\n\nRequirements list:\n${(jobPosting.requirements || []).map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

  const text = await chat(openai, 'gpt-4o-mini', system, user);
  const json = extractJson(text);
  const parsed = RequirementsOutputSchema.parse(json);
  return parsed.requirements;
}

/** Stage 2: Map profile to each requirement — evidence only, no inference. */
async function stage2MapEvidence(
  openai: OpenAI,
  requirements: RequirementItem[],
  userProfile: PipelineInput['userProfile']
): Promise<EvidenceMapItem[]> {
  const profileText = profileToText(userProfile);
  const reqList = requirements.map((r) => `- ${r.id}: ${r.label}${r.clarification ? ` (${r.clarification})` : ''}`).join('\n');

  const system = `For each requirement, find one evidence snippet from the candidate profile: a direct quote or one-sentence summary from work, project, or education. If the profile does not mention that requirement, set evidenceText to "no evidence", sourceType to "none", sourceName to "". Do not infer: e.g. React in the profile does not count as C++. Output JSON only, no markdown: { "items": [ { "requirementId", "requirementLabel", "evidenceText", "sourceType": "work"|"project"|"education"|"skill"|"none", "sourceName" }, ... ] }.`;

  const user = `Requirements (in order):\n${reqList}\n\nCandidate profile:\n${profileText}`;

  const text = await chat(openai, 'gpt-4o-mini', system, user);
  const json = extractJson(text);
  const parsed = EvidenceMapOutputSchema.parse(json);
  return parsed.items;
}

/** Stage 3: Generate cover letter from evidence map only (no raw profile). */
async function stage3GenerateLetter(
  openai: OpenAI,
  jobPosting: PipelineInput['jobPosting'],
  userProfile: PipelineInput['userProfile'],
  evidenceMap: EvidenceMapItem[],
  language: string,
  tone: string,
  sampleLetter?: string
): Promise<string> {
  const jobSummary = jobToShortSummary(jobPosting);
  const contactBlock = candidateContactBlock(userProfile);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const evidenceList = evidenceMap
    .filter((e) => e.evidenceText !== 'no evidence')
    .map((e) => `- ${e.requirementLabel}: ${e.evidenceText} (from ${e.sourceName})`)
    .join('\n');

  const langInstructions: Record<string, string> = {
    en: 'Write in English.',
    de: 'Write in German (Deutsch). Use formal business German.',
    fr: 'Write in French (Français). Use formal business French.',
    es: 'Write in Spanish (Español). Use formal business Spanish.',
    it: 'Write in Italian (Italiano). Use formal business Italian.',
    pt: 'Write in Portuguese (Português). Use formal business Portuguese.',
    nl: 'Write in Dutch (Nederlands). Use formal business Dutch.',
    pl: 'Write in Polish (Polski). Use formal business Polish.',
  };
  const langInstr = langInstructions[language] ?? langInstructions.en;

  const system = `Write a one-page cover letter (300–400 words). ${langInstr} Tone: ${tone}. Use only the evidence listed below; do not add skills or experiences not in the list. Format: business letter with contact block at top, then date, then company name and address (if provided), greeting, two body paragraphs, closing, signature. First paragraph: evidence items in order; second paragraph: next items. In the letter header and signature you MUST use the exact candidate name, email, phone, and address/location provided—no placeholders like [Your Name] or [Email Address]. Use the date provided. Use the company name and job title from the job summary; if company address is provided, use it.`;

  let user = `Candidate contact (use these exact values in the letter header and signature):\n${contactBlock}\n\nDate to use: ${today}\n\nJob summary:\n${jobSummary}\n\nEvidence (use only these):\n${evidenceList || '(none)'}`;
  if (sampleLetter) {
    user += `\n\nSample letter for structure and tone:\n---\n${sampleLetter}\n---`;
  }

  return chat(openai, 'gpt-4o', system, user, { temperature: 0.1, max_tokens: 1500 });
}

/** Stage 4: Validate that the letter only uses claims from the evidence map. */
async function stage4Validate(
  openai: OpenAI,
  letter: string,
  evidenceMap: EvidenceMapItem[]
): Promise<ValidationResult> {
  const evidenceTexts = evidenceMap.map((e) => e.evidenceText).filter((t) => t !== 'no evidence').join('\n');

  const system = `Check whether every skill or experience claim in the cover letter is supported by the evidence list. If all are supported: { "valid": true }. If any claim is not in the evidence list: { "valid": false, "violations": ["claim 1", "claim 2", ...] }. Output JSON only, no markdown.`;

  const user = `Evidence list:\n${evidenceTexts}\n\nCover letter:\n${letter}`;

  const text = await chat(openai, 'gpt-4o-mini', system, user);
  const json = extractJson(text);
  return ValidationOutputSchema.parse(json);
}

/** Normalize request data for serverless (defensive against missing/undefined). */
function normalizeInput(input: PipelineInput): PipelineInput {
  const job = input.jobPosting || {};
  const profile = input.userProfile || {};
  return {
    ...input,
    jobPosting: {
      jobTitle: job.jobTitle ?? '',
      companyName: job.companyName ?? '',
      positionType: job.positionType ?? 'full-time',
      description: job.description ?? '',
      requirements: Array.isArray(job.requirements) ? job.requirements : [],
      language: job.language ?? 'en',
      hiringManager: job.hiringManager,
      companyAddress: job.companyAddress,
      department: job.department,
    },
    userProfile: {
      name: profile.name ?? '',
      email: profile.email ?? '',
      phone: profile.phone,
      location: profile.location,
      skills: profile.skills,
      workExperience: profile.workExperience,
      education: profile.education,
      projects: profile.projects,
      academicContext: profile.academicContext,
    },
    language: input.language ?? job.language ?? 'en',
    tone: input.tone ?? 'professional',
  };
}

/** Run the full pipeline and return content + language. */
export async function runPipeline(input: PipelineInput): Promise<PipelineOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const normalized = normalizeInput(input);
  const openai = new OpenAI({ apiKey });

  const requirements = await stage1ExtractRequirements(openai, normalized.jobPosting);
  const evidenceMap = await stage2MapEvidence(openai, requirements, normalized.userProfile);
  const content = await stage3GenerateLetter(
    openai,
    normalized.jobPosting,
    normalized.userProfile,
    evidenceMap,
    normalized.language,
    normalized.tone,
    normalized.sampleLetter
  );
  const validation = await stage4Validate(openai, content, evidenceMap);

  return {
    content,
    language: normalized.language,
    evidenceMap,
    validation,
  };
}
