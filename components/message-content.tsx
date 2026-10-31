"use client";
import Markdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import { profile, resumeOptions } from "@/data/profile";
const allowed = new Set(
  [
    `mailto:${profile.contact.email}`,
    profile.contact.github,
    profile.contact.linkedin,
    profile.contact.portfolio,
    ...profile.projects.map((p) => p.url),
    ...resumeOptions.map((r) => r.url),
  ].filter(Boolean),
);
export function MessageContent({ text }: { text: string }) {
  return (
    <div className="markdown">
      <Markdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url) =>
          allowed.has(url) ? defaultUrlTransform(url) : ""
        }
        components={{
          a: ({ href, children }) =>
            href ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ) : (
              <span>{children}</span>
            ),
          img: () => null,
        }}
      >
        {text}
      </Markdown>
    </div>
  );
}
