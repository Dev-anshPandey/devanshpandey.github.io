import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ResumeData } from "./knowledge-schema";
export async function makeResumePdf(resume: ResumeData) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  document.setTitle(`${resume.name} — ${resume.label}`);
  document.setAuthor(resume.name);
  document.setSubject(
    "Privacy-safe résumé generated from supplied source; phone/address omitted.",
  );
  let page = document.addPage([595.28, 841.89]);
  let y = 792;
  const plain = (text: string) =>
    text
      .normalize("NFKC")
      .replace(/[–—]/g, "-")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/•/g, "-")
      .replace(/[^\x20-\x7e\n]/g, "");
  const line = (text: string, size = 10, heading = false) => {
    const font = heading ? bold : regular;
    for (const paragraph of plain(text).split("\n")) {
      let current = "";
      const flush = () => {
        if (y < 54) {
          page = document.addPage([595.28, 841.89]);
          y = 792;
        }
        page.drawText(current, {
          x: 44,
          y,
          size,
          font,
          color: heading ? rgb(0.07, 0.12, 0.22) : rgb(0.2, 0.23, 0.29),
        });
        y -= size * 1.45;
      };
      for (const word of paragraph.split(/\s+/)) {
        if (
          font.widthOfTextAtSize(`${current} ${word}`, size) > 505 &&
          current
        ) {
          flush();
          current = word;
        } else current += (current ? " " : "") + word;
      }
      flush();
    }
  };
  line(resume.name, 24, true);
  line(resume.label, 12, true);
  y -= 5;
  line(resume.contact.email, 10);
  line(`${resume.contact.linkedin} | ${resume.contact.github}`, 9);
  y -= 12;
  for (const section of [
    "summary",
    "experience",
    "projects",
    "skills",
    "education",
    "certifications",
  ] as const) {
    const content = resume[section];
    if (!content.length) continue;
    if (y < 120) {
      page = document.addPage([595.28, 841.89]);
      y = 792;
    }
    line(section.toUpperCase(), 11, true);
    y -= 4;
    for (const item of typeof content === "string" ? [content] : content) {
      line(item);
      y -= 5;
    }
    y -= 10;
  }
  line("PROJECT & PORTFOLIO LINKS", 11, true);
  for (const link of resume.links.filter(
    (l) => l !== resume.contact.github && l !== resume.contact.linkedin,
  ))
    line(link, 9);
  document.getPages().forEach((p, i, pages) =>
    p.drawText(`Privacy-safe copy | ${i + 1} / ${pages.length}`, {
      x: 44,
      y: 28,
      size: 8,
      font: regular,
      color: rgb(0.45, 0.48, 0.54),
    }),
  );
  return document.save();
}
