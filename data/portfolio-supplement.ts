import { profile } from "./profile";
// Verified against the original repository's index.html, Vitals project section.
// Keep the existing four-project overview unchanged; this project is available by name.
export const supplementalProjects = [{
  id: "vitals",
  title: "Vitals",
  description: "A Flutter fitness tracker that reads step and activity data from device sensors, caches data for offline use, and charts historical activity trends.",
  category: "Flutter · Nov 2022–Jan 2023",
  url: "https://github.com/Dev-anshPandey/vitals",
}];
export const allProjects = [...profile.projects, ...supplementalProjects];
export const portfolioSourceUrl = "https://github.com/Dev-anshPandey/devanshpandey.github.io/blob/master/index.html";
