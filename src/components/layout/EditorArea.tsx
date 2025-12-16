import React from "react";
import {
  User,
  FileText,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Zap,
  LayoutTemplate,
  Trash2,
  X,
} from "lucide-react";
import {
  Resume,
  SocialLink,
  EducationEntry,
  ExperienceEntry,
  Project,
} from "../../types";
import { ResumeSection } from "../ResumeSection";
import { FormInput } from "../FormInput";
import { ValidationResult } from "../../handlers/useResume";

console.log("DEBUG: EditorArea Imports", {
  ResumeSection,
  FormInput,
  Trash2,
  X,
  LayoutTemplate,
});

interface EditorAreaProps {
  resume: Resume;
  activeSection: string;
  validation: ValidationResult;
  updateResumeField: (field: keyof Resume, value: any) => void;
  updateSkills: (field: keyof Resume["skills"], value: string) => void;
  updateLayout: (field: keyof Resume["layout"], value: string) => void;
  handleSocialChange: (index: number, partial: Partial<SocialLink>) => void;
  addSocialLink: () => void;
  removeSocialLink: (index: number) => void;
  handleEducationChange: (
    index: number,
    entry: Partial<EducationEntry>
  ) => void;
  handleExperienceChange: (
    index: number,
    entry: Partial<ExperienceEntry>
  ) => void;
  handleProjectChange: (index: number, entry: Partial<Project>) => void;
  removeEducation: (index: number) => void;
  removeExperience: (index: number) => void;
  removeProject: (index: number) => void;
  addEducation: () => void;
  addExperience: () => void;
  addProject: () => void;
  setActiveSection: (section: string) => void;
}

export const EditorArea: React.FC<EditorAreaProps> = ({
  resume,
  activeSection,
  validation,
  updateResumeField,
  updateSkills,
  updateLayout,
  handleSocialChange,
  addSocialLink,
  removeSocialLink,
  handleEducationChange,
  handleExperienceChange,
  handleProjectChange,
  removeEducation,
  removeExperience,
  removeProject,
  addEducation,
  addExperience,
  addProject,
  setActiveSection,
}) => {
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("section-", "");
            // Only update if different to avoid potential loops (though React handles loose equality)
            // We use a functional update or just call it.
            // But we need to be careful not to spam updates.
            // Since activeSection is prop, we can check it, but effects depend on closures.
            // Better to just dispatch.
            if (typeof setActiveSection === "function") {
              setActiveSection(id);
            }
          }
        });
      },
      {
        root: document.querySelector(".editor-area"), // Use the scroll container
        threshold: 0, // Trigger immediately when sensitive area is touched
        rootMargin: "-20% 0px -65% 0px", // Focus on an active band near the top
      }
    );

    const sections = [
      "personal",
      "summary",
      "education",
      "experience",
      "projects",
      "skills",
      "layout",
    ];

    sections.forEach((section) => {
      const element = document.getElementById(`section-${section}`);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [setActiveSection]);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (typeof setActiveSection === "function") {
        setActiveSection("layout");
      }
    }
  };

  return (
    <main
      className="editor-area custom-scrollbar pb-[50vh]"
      onScroll={handleScroll}>
      {/* Personal Section */}
      <div className="mb-12">
        <ResumeSection
          id="section-personal"
          title="Personal Information"
          description="Start with the basics. Employers need to know who you are and how to contact you."
          icon={
            <div className="icon-circle">
              <User size={20} />
            </div>
          }
          isOpen={true}
          onToggle={() => {}}
          validationErrors={validation.errorsBySection["personal"]}
          badge="Required">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            <FormInput
              label="Full Name"
              value={resume.name}
              onChange={(e) => updateResumeField("name", e.target.value)}
              placeholder="e.g. John Doe"
              containerStyle={{ marginBottom: 0 }}
            />
            <FormInput
              label="Job Title"
              value={resume.title}
              onChange={(e) => updateResumeField("title", e.target.value)}
              aiContext="Job Title"
              placeholder="e.g. Software Engineer"
              containerStyle={{ marginBottom: 0 }}
            />
            <FormInput
              label="Phone"
              value={resume.phone}
              onChange={(e) => updateResumeField("phone", e.target.value)}
              placeholder="+1 234 567 890"
              containerStyle={{ marginBottom: 0 }}
            />
            <FormInput
              label="Email"
              value={resume.email}
              onChange={(e) => updateResumeField("email", e.target.value)}
              placeholder="john@example.com"
              containerStyle={{ marginBottom: 0 }}
            />
          </div>

          <div className="mt-6">
            <label className="form-label mb-2 block">Social Links</label>
            {resume.social_links.map((link, i) => (
              <div key={i} className="flex gap-3 mb-3 items-start">
                <FormInput
                  placeholder="Platform (e.g. LinkedIn)"
                  containerStyle={{ marginBottom: 0, flex: 1 }}
                  value={link.name}
                  onChange={(e) =>
                    handleSocialChange(i, { name: e.target.value })
                  }
                />
                <FormInput
                  placeholder="URL (https://...)"
                  containerStyle={{ marginBottom: 0, flex: 2 }}
                  value={link.url}
                  onChange={(e) =>
                    handleSocialChange(i, { url: e.target.value })
                  }
                />
                <button
                  className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors mt-2"
                  onClick={() => removeSocialLink(i)}
                  title="Remove Link">
                  <X size={18} />
                </button>
              </div>
            ))}
            <button
              className="btn btn-secondary text-xs mt-1"
              onClick={addSocialLink}>
              + Add Link
            </button>
          </div>
        </ResumeSection>
      </div>

      {/* Summary */}
      <div className="mb-12">
        <ResumeSection
          id="section-summary"
          title="Professional Summary"
          description="Write a short summary of your background and career goals."
          icon={
            <div className="icon-circle">
              <FileText size={20} />
            </div>
          }
          isOpen={true}
          onToggle={() => {}}
          validationErrors={validation.errorsBySection["summary"]}
          badge="Required">
          <FormInput
            textarea
            label="Summary"
            value={resume.summary}
            onChange={(e) => updateResumeField("summary", e.target.value)}
            aiContext="Professional Resume Summary"
            placeholder="Experienced software developer with a focus on..."
            className="min-h-[400px] mt-2"
          />
        </ResumeSection>
      </div>

      {/* Education */}
      <div className="mb-12">
        <ResumeSection
          id="section-education"
          title="Education"
          description="Add your academic background."
          icon={
            <div className="icon-circle">
              <GraduationCap size={20} />
            </div>
          }
          isOpen={true}
          onToggle={() => {}}
          validationErrors={validation.errorsBySection["education"]}
          badge="Required">
          {resume.education.map((edu, i) => (
            <div
              key={i}
              className="bg-slate-50 p-4 rounded-lg my-4 border border-slate-100 relative group">
              <button
                className="absolute top-4 right-4 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"
                onClick={() => removeEducation(i)}
                title="Remove Entry">
                <Trash2 size={18} />
              </button>
              <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
                Item {i + 1}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormInput
                  label="Institution"
                  value={edu.institution}
                  onChange={(e) =>
                    handleEducationChange(i, {
                      institution: e.target.value,
                    })
                  }
                  placeholder="University Name"
                  containerStyle={{ marginBottom: 0 }}
                />
                <FormInput
                  label="Degree"
                  value={edu.degree}
                  onChange={(e) =>
                    handleEducationChange(i, { degree: e.target.value })
                  }
                  placeholder="Bachelor of Science"
                  containerStyle={{ marginBottom: 0 }}
                />
                <FormInput
                  label="Grade/GPA"
                  value={edu.grade}
                  onChange={(e) =>
                    handleEducationChange(i, { grade: e.target.value })
                  }
                  placeholder="3.8/4.0"
                  containerStyle={{ marginBottom: 0 }}
                />
                <FormInput
                  label="Date Period"
                  value={edu.duration}
                  onChange={(e) =>
                    handleEducationChange(i, { duration: e.target.value })
                  }
                  placeholder="Sep 2018 - Jun 2022"
                  containerStyle={{ marginBottom: 0 }}
                />
              </div>
            </div>
          ))}
          <button
            className="btn btn-primary w-full shadow-lg shadow-indigo-100"
            onClick={addEducation}>
            + Add Education
          </button>
        </ResumeSection>
      </div>

      {/* Work Experience */}
      <div className="mb-12">
        <ResumeSection
          id="section-experience"
          title="Work Experience"
          description="List your relevant work experience, starting with the most recent."
          icon={
            <div className="icon-circle">
              <Briefcase size={20} />
            </div>
          }
          isOpen={true}
          onToggle={() => {}}>
          {resume.experiences.map((exp, i) => (
            <div
              key={i}
              className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100 relative group mt-5">
              <button
                className="absolute top-4 right-4 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"
                onClick={() => removeExperience(i)}
                title="Remove Entry">
                <Trash2 size={18} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-4">
                <FormInput
                  label="Job Role"
                  value={exp.role}
                  onChange={(e) =>
                    handleExperienceChange(i, { role: e.target.value })
                  }
                  aiContext="Job Role Title"
                  placeholder="Software Engineer"
                  containerStyle={{ marginBottom: 0 }}
                />
                <FormInput
                  label="Company"
                  value={exp.org}
                  onChange={(e) =>
                    handleExperienceChange(i, { org: e.target.value })
                  }
                  placeholder="Acme Corp"
                  containerStyle={{ marginBottom: 0 }}
                />
                <FormInput
                  label="Location"
                  value={exp.location}
                  onChange={(e) =>
                    handleExperienceChange(i, {
                      location: e.target.value,
                    })
                  }
                  placeholder="New York, NY"
                  containerStyle={{ marginBottom: 0 }}
                />
                <FormInput
                  label="Duration"
                  value={exp.duration}
                  onChange={(e) =>
                    handleExperienceChange(i, {
                      duration: e.target.value,
                    })
                  }
                  placeholder="Jan 2022 - Present"
                  containerStyle={{ marginBottom: 0 }}
                />
              </div>

              <div className="pl-2 border-l-2 border-slate-200">
                <label className="form-label mb-2 block text-slate-500">
                  Responsibilities
                </label>
                {exp.bullets.map((b, bi) => (
                  <div key={bi} className="flex gap-2 mb-2">
                    <FormInput
                      containerStyle={{ marginBottom: 0, flex: 1 }}
                      value={b}
                      onChange={(e) => {
                        const newBullets = [...exp.bullets];
                        newBullets[bi] = e.target.value;
                        handleExperienceChange(i, {
                          bullets: newBullets,
                        });
                      }}
                      aiContext={`Resume bullet point for ${exp.role}`}
                      placeholder="• Developed a feature that..."
                    />
                    <button
                      className="text-bold text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-full transition-colors self-start mt-2 mb-6"
                      onClick={() => {
                        const newBullets = [...exp.bullets];
                        newBullets.splice(bi, 1);
                        handleExperienceChange(i, {
                          bullets: newBullets,
                        });
                      }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  className="btn btn-secondary text-xs mt-1"
                  onClick={() =>
                    handleExperienceChange(i, {
                      bullets: [...exp.bullets, ""],
                    })
                  }>
                  + Add Bullet
                </button>
              </div>
            </div>
          ))}
          <button
            className="btn btn-primary w-full shadow-lg shadow-indigo-100"
            onClick={addExperience}>
            + Add Experience
          </button>
        </ResumeSection>
      </div>

      {/* Projects */}
      <div className="mb-12">
        <ResumeSection
          id="section-projects"
          title="Projects"
          description="Showcase your best work."
          icon={
            <div className="icon-circle">
              <FolderGit2 size={20} />
            </div>
          }
          isOpen={true}
          onToggle={() => {}}>
          {resume.projects.map((proj, i) => (
            <div
              key={i}
              className="bg-slate-50 p-4 rounded-lg my-4 border border-slate-100 relative group">
              <button
                className="absolute top-4 right-4 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-all"
                onClick={() => removeProject(i)}
                title="Remove Entry">
                <Trash2 size={18} />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-3">
                <FormInput
                  label="Project Title"
                  value={proj.title}
                  onChange={(e) =>
                    handleProjectChange(i, { title: e.target.value })
                  }
                  placeholder="My Awesome App"
                  containerStyle={{ marginBottom: 0 }}
                />
                <FormInput
                  label="Date"
                  value={proj.date}
                  onChange={(e) =>
                    handleProjectChange(i, { date: e.target.value })
                  }
                  placeholder="2023"
                  containerStyle={{ marginBottom: 0 }}
                />
              </div>
              <FormInput
                label="Tech Stack / Subtitle"
                value={proj.subtitle}
                onChange={(e) =>
                  handleProjectChange(i, { subtitle: e.target.value })
                }
                placeholder="React, Node.js, TypeScript"
                aiContext="Project Technologies"
              />

              <div className="mt-3 pl-2 border-l-2 border-slate-200">
                <label className="form-label mb-2 block text-slate-500">
                  Details
                </label>
                {proj.bullets.map((b, bi) => (
                  <div key={bi} className="flex gap-2 mb-2">
                    <FormInput
                      containerStyle={{ marginBottom: 0, flex: 1 }}
                      value={b}
                      onChange={(e) => {
                        const newBullets = [...proj.bullets];
                        newBullets[bi] = e.target.value;
                        handleProjectChange(i, { bullets: newBullets });
                      }}
                      aiContext="Project Bullet Point"
                      placeholder="• Built a scalable backend..."
                    />
                    <button
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1 rounded-full transition-colors self-start mt-2"
                      onClick={() => {
                        const newBullets = [...proj.bullets];
                        newBullets.splice(bi, 1);
                        handleProjectChange(i, { bullets: newBullets });
                      }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  className="btn btn-secondary text-xs mt-1"
                  onClick={() =>
                    handleProjectChange(i, {
                      bullets: [...proj.bullets, ""],
                    })
                  }>
                  + Add Detail
                </button>
              </div>
            </div>
          ))}
          <button
            className="btn btn-primary w-full shadow-lg shadow-indigo-100"
            onClick={addProject}>
            + Add Project
          </button>
        </ResumeSection>
      </div>

      {/* Skills */}
      <div className="mb-12">
        <ResumeSection
          id="section-skills"
          title="Skills & Interests"
          icon={
            <div className="icon-circle">
              <Zap size={20} />
            </div>
          }
          isOpen={true}
          onToggle={() => {}}>
          <div className="grid grid-cols-1 gap-5 my-3">
            <FormInput
              label="Languages"
              value={resume.skills.languages}
              onChange={(e) => updateSkills("languages", e.target.value)}
              placeholder="Java, Python, C++"
              containerStyle={{ marginBottom: 0 }}
            />
            <FormInput
              label="Frameworks"
              value={resume.skills.frameworks}
              onChange={(e) => updateSkills("frameworks", e.target.value)}
              placeholder="React, Spring Boot"
              containerStyle={{ marginBottom: 0 }}
            />
            <FormInput
              label="Tools"
              value={resume.skills.web_tools}
              onChange={(e) => updateSkills("web_tools", e.target.value)}
              placeholder="Git, Docker, AWS"
              containerStyle={{ marginBottom: 0 }}
            />
            <FormInput
              label="Databases"
              value={resume.skills.cloud_databases}
              onChange={(e) => updateSkills("cloud_databases", e.target.value)}
              placeholder="PostgreSQL, MongoDB"
              containerStyle={{ marginBottom: 0 }}
            />
            <FormInput
              textarea
              label="Relevant Coursework"
              value={resume.skills.coursework}
              onChange={(e) => updateSkills("coursework", e.target.value)}
              placeholder="Data Structures, Algorithms..."
              containerStyle={{ marginBottom: 0 }}
            />
          </div>
        </ResumeSection>
      </div>

      {/* Layout */}
      <div className="mb-12">
        <ResumeSection
          id="section-layout"
          title="Layout Settings"
          description="Fine-tune your resume's spacing."
          icon={
            <div className="icon-circle">
              <LayoutTemplate size={20} />
            </div>
          }
          isOpen={true}
          onToggle={() => {}}>
          <div className="grid grid-cols-2 gap-5 my-3">
            <FormInput
              label="Section Spacing Top"
              value={resume.layout.section_spacing_top}
              onChange={(e) =>
                updateLayout("section_spacing_top", e.target.value)
              }
              containerStyle={{ marginBottom: 0 }}
            />
            <FormInput
              label="Section Spacing Bottom"
              value={resume.layout.section_spacing_bottom}
              onChange={(e) =>
                updateLayout("section_spacing_bottom", e.target.value)
              }
              containerStyle={{ marginBottom: 0 }}
            />
            <FormInput
              label="Section Spacing After"
              value={resume.layout.section_spacing_after}
              onChange={(e) =>
                updateLayout("section_spacing_after", e.target.value)
              }
              containerStyle={{ marginBottom: 0 }}
            />
            <FormInput
              label="Bullet Spacing"
              value={resume.layout.bullet_spacing}
              onChange={(e) => updateLayout("bullet_spacing", e.target.value)}
              containerStyle={{ marginBottom: 0 }}
            />
          </div>
        </ResumeSection>
      </div>
    </main>
  );
};
