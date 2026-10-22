import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { clampText } from "./parse";

// Structured, digital form of a resume. Every field is required by the
// structured-output contract; the model returns "" or [] when the resume
// does not state something. Grounding rule: only facts from the resume text.
export const ResumeProfileSchema = z.object({
  fullName: z.string(),
  headline: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  links: z.array(z.string()),
  summary: z.string(),
  skills: z.array(z.string()),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      location: z.string(),
      start: z.string(),
      end: z.string(),
      bullets: z.array(z.string()),
    })
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      school: z.string(),
      year: z.string(),
    })
  ),
  publications: z.array(z.string()),
  languages: z.array(z.string()),
});

export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

export async function parseResumeStructure(resumeText: string): Promise<ResumeProfile> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not configured on the server.");
  const client = new OpenAI({ apiKey: key });

  const completion = await client.chat.completions.parse({
    model: MODEL,
    temperature: 0.1,
    messages: [
      {
        role: "system",
        content: `You convert a plain-text resume into a structured digital resume. Extract ONLY facts that appear in the resume text. Never invent employers, titles, dates, metrics, schools, skills or contact details. If a field is not stated, return an empty string or an empty array. Keep experience bullets close to the original wording. The headline is the candidate's professional title line (for example "Senior Machine Learning Engineer"); if none is stated, derive it from the most recent role title only. Dates: copy the format used in the resume (for example "Jan 2024" or "2024").`,
      },
      {
        role: "user",
        content: `RESUME TEXT:\n${clampText(resumeText, 30000)}`,
      },
    ],
    response_format: zodResponseFormat(ResumeProfileSchema, "resume_profile"),
  });

  const parsed = completion.choices[0]?.message.parsed;
  if (!parsed) throw new Error("Could not structure that resume. Try a different file or paste the text.");
  return parsed;
}
