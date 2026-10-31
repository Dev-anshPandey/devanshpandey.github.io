import mobile from "./generated/software-mobile.json";
import ai from "./generated/applied-ai.json";
import deployed from "./generated/forward-deployed.json";

// Public facts verified against the three sanitized source résumés.
export const resumeOptions = [mobile, ai, deployed].map(({ id, label }) => ({
  id,
  label,
  url: `/api/resume/${id}`,
}));
export const profile = {
  name: "Devansh",
  fullName: mobile.name,
  headline: "Software Engineer",
  role: "Software engineer working across production mobile apps, Applied AI, and application integration",
  subtitle: "Mobile craftsmanship. Grounded AI. Real-world delivery.",
  location: "Location available on request",
  roots: "",
  experience:
    "Production experience at Exly, with earlier roles at UKG and Dao Studio",
  education: {
    degree: "B.Tech in Computer Science and Engineering",
    institution: "KIET Group of Institutions",
    cgpa: "8.18",
  },
  avatar: "/avatar.svg",
  openToWork: false,
  skills: [
    "React Native",
    "Flutter",
    "Python",
    "TypeScript",
    "JavaScript",
    "Dart",
    "Java",
    "React.js",
    "REST APIs",
    "Firebase",
    "Socket.IO",
  ],
  learning: [
    "RAG",
    "OpenAI API",
    "Anthropic API",
    "LangChain",
    "Embeddings",
    "Vector databases",
    "Function calling",
  ],
  interests: [],
  projects: [
    {
      id: "creator-ai",
      title: "Exly Creator App",
      description:
        "Creator-specific RAG assistants grounded in course content, offerings, and creator information, integrated into production mobile apps.",
      category: "Applied AI · 2025–2026",
      url: "",
    },
    {
      id: "chronicle",
      title: "Chronicle",
      description:
        "A personalized AI newspaper with retrieval, grounding, summarization, and structured generation based on user-selected topics.",
      category: "Generative AI · 2026",
      url: "https://thechronicle-ai.vercel.app/",
    },
    {
      id: "kaash",
      title: "Kaash",
      description:
        "A live consultation platform with booking, video calling, real-time chat, and end-to-end Play Store release management.",
      category: "Mobile · Jul–Dec 2025",
      url: "https://play.google.com/store/apps/details?id=com.kaash.vaastu",
    },
    {
      id: "mutual",
      title: "Mutual Network",
      description:
        "Social feeds, profiles, discovery, circle-based relationships, Socket.IO chat, and JWT authentication.",
      category: "Mobile · May–Nov 2023",
      url: "https://play.google.com/store/apps/details?id=com.mutual.live",
    },
  ],
  contact: { ...mobile.contact, resume: "/api/resume/software-mobile" },
};
export const presets = [
  { id: "me", label: "Me", question: "Tell me about yourself." },
  {
    id: "projects",
    label: "Projects",
    question: "What projects have you built?",
  },
  { id: "skills", label: "Skills", question: "What are your skills?" },
  { id: "fun", label: "Fun", question: "What do you enjoy outside of work?" },
  { id: "contact", label: "Contact", question: "How can I reach you?" },
] as const;
export type Section = (typeof presets)[number]["id"];
export const followups = [
  "Tell me about your RAG work.",
  "What is your experience?",
  "Can I download your résumés?",
];
export const fallback =
  "I don't have that on hand, but you can reach me via the Contact section";
export function sectionSummary(section: Section): string {
  switch (section) {
    case "me":
      return "I'm Devansh, a software engineer with production experience in React Native, Flutter, and AI integrations. At Exly, I worked on creator-specific RAG assistants and mobile application workflows. My earlier roles at UKG and Dao Studio involved data automation and cross-platform application features.";
    case "projects":
      return `Here's what I've built: ${profile.projects.map((p) => `${p.title} — ${p.description}`).join(" ")}`;
    case "skills":
      return `I work with ${profile.skills.join(", ")}. My AI experience includes ${profile.learning.join(", ")}.`;
    case "fun":
      return "My résumés focus on my engineering work and don’t cover personal hobbies. I’d be happy to share more directly—head to Contact to say hello.";
    case "contact":
      return `You can reach me at ${profile.contact.email}, or find me on GitHub and LinkedIn. Three résumé versions are available below, tailored to mobile engineering, Applied AI, and forward-deployed engineering.`;
  }
}
