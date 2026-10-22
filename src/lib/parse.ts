import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

const MAX_RESUME_CHARS = 26000;
const MAX_JD_CHARS = 14000;

export function clampText(text: string, max: number): string {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return clean.length > max ? clean.slice(0, max) : clean;
}

export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return clampText(Array.isArray(text) ? text.join("\n") : text, MAX_RESUME_CHARS);
  }

  if (
    name.endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer: buf });
    return clampText(result.value, MAX_RESUME_CHARS);
  }

  if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
    return clampText(buf.toString("utf-8"), MAX_RESUME_CHARS);
  }

  throw new Error("Unsupported file type. Upload a PDF or DOCX resume.");
}

export function cleanJd(text: string): string {
  return clampText(text, MAX_JD_CHARS);
}
