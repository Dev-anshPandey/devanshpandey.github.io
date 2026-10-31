import {
  ArrowUpRight,
  GraduationCap,
  Radar,
  Compass,
  Mail,
  Code2,
  BriefcaseBusiness,
  FileText,
} from "lucide-react";
import {
  profile,
  resumeOptions,
  sectionSummary,
  type Section,
} from "@/data/profile";

export function ProfileCard({ section }: { section: Section }) {
  if (section === "me")
    return (
      <div className="rich-card">
        <div className="card-eyebrow">A LITTLE ABOUT ME</div>
        <h2>Hi, I’m {profile.name}.</h2>
        <p>{sectionSummary("me")}</p>
        <div className="facts">
          <span>{profile.experience}</span>
        </div>
        <div className="education">
          <GraduationCap size={22} />
          <div>
            <strong>{profile.education.degree}</strong>
            <p>
              {profile.education.institution} · CGPA {profile.education.cgpa}
            </p>
          </div>
        </div>
      </div>
    );
  if (section === "projects")
    return (
      <div className="rich-card">
        <div className="card-eyebrow">IDEAS INTO PRODUCTS</div>
        <h2>What I’m building.</h2>
        <div className="project-grid">
          {profile.projects.map((project, i) => (
            <article className="project" key={project.id}>
              <div className={`project-art art-${i % 2}`} aria-hidden="true">
                {i % 2 === 0 ? (
                  <Radar size={66} strokeWidth={1} />
                ) : (
                  <Compass size={66} strokeWidth={1} />
                )}
                <span>0{i + 1}</span>
              </div>
              <div className="project-copy">
                <span className="card-eyebrow">{project.category}</span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                {project.url ? (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Explore project <ArrowUpRight size={16} />
                  </a>
                ) : (
                  <span className="unavailable">Project link coming soon</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  if (section === "skills")
    return (
      <div className="rich-card">
        <div className="card-eyebrow">MY TOOLKIT</div>
        <h2>Mobile craft. Applied AI.</h2>
        <p>
          I build production mobile applications and grounded AI experiences.
        </p>
        <h3 className="small-heading">Working with</h3>
        <div className="chips">
          {profile.skills.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
        <h3 className="small-heading">Applied AI experience</h3>
        <div className="chips learning">
          {profile.learning.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </div>
    );
  if (section === "fun")
    return (
      <div className="rich-card">
        <div className="card-eyebrow">BEYOND THE CODE</div>
        <h2>There’s more to me than a résumé.</h2>
        <p>{sectionSummary("fun")}</p>
        <div className="chips">
          {profile.interests.map((interest) => (
            <span key={interest}>{interest}</span>
          ))}
        </div>
      </div>
    );
  const links = [
    {
      name: "Email",
      url: profile.contact.email ? `mailto:${profile.contact.email}` : "",
      Icon: Mail,
    },
    { name: "GitHub", url: profile.contact.github, Icon: Code2 },
    {
      name: "LinkedIn",
      url: profile.contact.linkedin,
      Icon: BriefcaseBusiness,
    },
    { name: "Résumé", url: profile.contact.resume, Icon: FileText },
  ];
  return (
    <div className="rich-card">
      <div className="card-eyebrow">LET’S CONNECT</div>
      <h2>Good conversations start here.</h2>
      <p>{sectionSummary("contact")}</p>
      <div className="contact-grid">
        {links.map(({ name, url, Icon }) =>
          url ? (
            <a key={name} href={url} target="_blank" rel="noopener noreferrer">
              <Icon size={19} />
              {name}
              <ArrowUpRight size={16} />
            </a>
          ) : (
            <div className="contact-pending" key={name}>
              <Icon size={19} />
              <span>
                {name}
                <small>Coming soon</small>
              </span>
            </div>
          ),
        )}
      </div>
      <div className="resume-downloads">
        <h3 className="small-heading">Choose a résumé</h3>
        {resumeOptions.map((resume) => (
          <a key={resume.id} href={resume.url} download>
            <FileText size={18} />
            <span>
              {resume.label}
              <small>Download privacy-safe PDF</small>
            </span>
            <ArrowUpRight size={16} />
          </a>
        ))}
      </div>
    </div>
  );
}
