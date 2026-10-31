import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Devansh — Software Engineer",
  description:
    "Meet Devansh. Flutter and React Native engineer exploring Applied AI. Discover my projects, skills, and story through a conversation.",
  openGraph: {
    title: "Devansh — Let’s talk.",
    description:
      "A conversational portfolio. Projects, skills, and a little about me.",
    type: "website",
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
