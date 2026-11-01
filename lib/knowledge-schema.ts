export type ResumeSection =
  | "summary"
  | "experience"
  | "projects"
  | "skills"
  | "education"
  | "certifications"
  | "contact";
export interface ResumeData {
  id: string;
  label: string;
  name: string;
  sourceFile: string;
  summary: string;
  experience: string[];
  projects: string[];
  skills: string[];
  education: string[];
  certifications: string[];
  links: string[];
  contact: {
    email: string;
    github: string;
    linkedin: string;
    portfolio: string;
  };
}
export interface KnowledgeChunk {
  id: string;
  resumeId: string;
  section: ResumeSection;
  title?: string;
  text: string;
  embedding: number[];
}
export interface KnowledgeBase {
  version: 1;
  embedding: {
    provider: "local-hash";
    model: string;
    dimensions: number;
  };
  resumes: ResumeData[];
  chunks: KnowledgeChunk[];
}

export function cleanResumeText(input: string) {
  return input
    .normalize("NFKC")
    .replace(/([a-z])-\s*\n\s*([a-z])/g, "$1$2")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
/** Raw sources are never persisted. Remove contact telephone and street-address lines before embedding. */
export function redactPrivateData(input: string) {
  return input
    .replace(/(?:\+?\d[\d ()-]{7,}\d)/g, (value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15
        ? "[phone omitted]"
        : value;
    })
    .split("\n")
    .filter(
      (line) =>
        !/(?:home|residential|street|postal|permanent|mailing)\s+address\s*:|\b(?:flat|house|apartment)\s*(?:no\.?|#)\s*\w+|^\s*\d+\s+.*\b(?:street|road|avenue|lane)\b/i.test(
          line,
        ),
    )
    .join("\n");
}
export function tokens(text: string) {
  return text.toLowerCase().match(/[\p{L}\p{N}+#.]+/gu) || [];
}
/** Offline lexical vectors; explicitly not represented as neural semantic embeddings. */
export function localEmbedding(text: string, dimensions = 256) {
  const vector = Array<number>(dimensions).fill(0);
  for (const term of tokens(text)) {
    let hash = 2166136261;
    for (const char of term)
      hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    vector[(hash >>> 0) % dimensions] += 1;
  }
  const norm = Math.hypot(...vector) || 1;
  return vector.map((v) => Math.round((v / norm) * 1e6) / 1e6);
}
export function cosine(a: number[], b: number[]) {
  if (a.length !== b.length) return 0;
  return (
    a.reduce((sum, v, i) => sum + v * b[i], 0) /
    (Math.hypot(...a) * Math.hypot(...b) || 1)
  );
}
