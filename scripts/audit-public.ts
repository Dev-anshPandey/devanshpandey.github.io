import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
const errors: string[] = [];
async function scan(directory: string) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await scan(file);
      continue;
    }
    if (!/\.(ts|tsx|json|md|css)$/.test(file)) continue;
    const text = await readFile(file, "utf8");
    if (/sk-(?:proj-)?[A-Za-z0-9_-]{20,}/.test(text))
      errors.push(`${file}: possible provider credential`);
    if (file.startsWith("data/") && /(?:\+?91[ -]?)?[6-9]\d{9}\b/.test(text))
      errors.push(`${file}: possible unredacted phone number`);
    if (
      file.startsWith("data/") &&
      /(?:home|residential|street) address\s*:/i.test(text)
    )
      errors.push(`${file}: possible private address`);
  }
}
for (const directory of [
  "app",
  "components",
  "data",
  "lib",
  "scripts",
  "tests",
])
  await scan(directory);
const ignore = await readFile(".gitignore", "utf8");
for (const pattern of [
  ".env*",
  "node_modules/",
  ".next/",
  "*.pdf",
  "*.docx",
  "resumes/",
])
  if (!ignore.includes(pattern)) errors.push(`Missing ignore rule: ${pattern}`);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else
  console.log(
    "Public-source audit passed: no detected provider keys, phone numbers, or labeled private addresses. Raw résumé and env ignore rules are present. Review the staged diff too.",
  );
