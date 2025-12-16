import React, { useEffect, useState } from "react";
import {
  Resume,
  Project,
  EducationEntry,
  ExperienceEntry,
  SocialLink,
} from "./types";
import { fetchResume, saveResume, renderLatex, renderPdf } from "./api";
import AiAssistant from "./components/AiAssistant";
import { ResumeSection } from "./components/ResumeSection";
import { FormInput } from "./components/FormInput";
import "./App.css";

// Helper Icons
const IconP = () => (
  <div
    className="icon-circle"
    style={{ background: "#dbeafe", color: "#1d4ed8" }}>
    P
  </div>
);
const IconE = () => (
  <div
    className="icon-circle"
    style={{ background: "#e0f2fe", color: "#0369a1" }}>
    E
  </div>
);
const IconX = () => (
  <div
    className="icon-circle"
    style={{ background: "#fef3c7", color: "#b45309" }}>
    X
  </div>
);
const IconS = () => (
  <div
    className="icon-circle"
    style={{ background: "#ede9fe", color: "#6d28d9" }}>
    S
  </div>
);
const IconPr = () => (
  <div
    className="icon-circle"
    style={{ background: "#cffafe", color: "#0f766e" }}>
    Pr
  </div>
);
const IconL = () => (
  <div
    className="icon-circle"
    style={{ background: "#fee2e2", color: "#b91c1c" }}>
    L
  </div>
);
const IconSum = () => (
  <div
    className="icon-circle"
    style={{ background: "#dcfce7", color: "#15803d" }}>
    Σ
  </div>
);

interface ValidationResult {
  ok: boolean;
  messages: string[];
}

const validateResume = (resume: Resume): ValidationResult => {
  const messages: string[] = [];
  if (!resume.name.trim()) messages.push("Name is required.");
  if (!resume.email.trim()) messages.push("Email is required.");
  if (!resume.summary.trim()) messages.push("Summary is required.");
  if (resume.education.length === 0)
    messages.push("At least one education entry is required.");
  if (resume.education.some((e) => !e.institution.trim()))
    messages.push("All education entries need an institution.");
  return { ok: messages.length === 0, messages };
};

const App: React.FC = () => {
  const [resume, setResume] = useState<Resume | null>(null);
  const [latex, setLatex] = useState<string>("");
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [validation, setValidation] = useState<ValidationResult>({
    ok: true,
    messages: [],
  });
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchResume()
      .then((data) => {
        const normalised: Resume = {
          name: data.name || "",
          title: data.title || "",
          phone: data.phone || "",
          email: data.email || "",
          social_links: data.social_links || [],
          summary: data.summary || "",
          education: data.education || [],
          experiences: data.experiences || [],
          projects: data.projects || [],
          skills: data.skills || {
            languages: "",
            frameworks: "",
            libraries: "",
            web_tools: "",
            cloud_databases: "",
            coursework: "",
            areas_of_interest: "",
            soft_skills: "",
          },
          layout: data.layout || {
            section_spacing_top: "2mm",
            section_spacing_bottom: "2mm",
            bullet_spacing: "0mm",
            section_spacing_after: "-5.5mm",
          },
        };
        setResume(normalised);
        setValidation(validateResume(normalised));
      })
      .catch(console.error);
  }, []);

  /* ---------- Helpers ---------- */

  // Basic LaTeX escaping to prevent syntax errors on the backend
  const escapeLatex = (str: string): string => {
    if (!str) return "";
    let escaped = str;
    // Escape backslash first to avoid escaping the escapes
    escaped = escaped.replace(/\\/g, "\\textbackslash ");
    // Escape other special chars. Note: We do NOT escape { } here because they might be part of valid logic if we assume input is plain text.
    // However, for resume content, { } are usually just text.
    // If we escape them to \{ \}, it prints braces.
    escaped = escaped.replace(/([&%$#_{}])/g, "\\$1");
    escaped = escaped.replace(/~/g, "\\textasciitilde ");
    escaped = escaped.replace(/\^/g, "\\textasciicircum ");
    // Replace newlines with double backslash for line breaks
    escaped = escaped.replace(/\n/g, " \\\\ ");
    return escaped;
  };

  // Ensure a string is a valid LaTeX dimension (e.g., "10pt", "0.5cm").
  // If invalid or just a number, fix it.
  const fixLatexDimension = (val: string): string => {
    if (!val) return "0pt";
    const trimmed = val.trim();
    // If it's just a number, assume pt
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return `${trimmed}pt`;
    }
    // proper regex for latex units: pt, mm, cm, in, ex, em, pc, bp, dd, cc, sp
    // allow flexible spacing
    if (/^-?\d+(\.\d+)?\s*(pt|mm|cm|in|ex|em|pc|bp|dd|cc|sp)$/i.test(trimmed)) {
      return trimmed;
    }
    // If it acts like a unit but is invalid (e.g. "2m"), fallback to 0pt to prevent crash
    return "0pt";
  };

  const sanitizeResume = (r: Resume): Resume => {
    // Deep clone to avoid mutating state
    const clean = JSON.parse(JSON.stringify(r)) as Resume;

    const sanitizeField = (obj: any, key: string) => {
      if (typeof obj[key] === "string") {
        obj[key] = escapeLatex(obj[key]);
      }
    };

    sanitizeField(clean, "name");
    sanitizeField(clean, "title");
    sanitizeField(clean, "phone");
    sanitizeField(clean, "email");
    sanitizeField(clean, "summary");

    clean.social_links.forEach((link) => {
      sanitizeField(link, "name");
      sanitizeField(link, "url");
    });

    clean.education.forEach((edu) => {
      sanitizeField(edu, "degree");
      sanitizeField(edu, "grade");
      sanitizeField(edu, "institution");
      sanitizeField(edu, "duration");
    });

    clean.experiences.forEach((exp) => {
      sanitizeField(exp, "role");
      sanitizeField(exp, "org");
      sanitizeField(exp, "location");
      sanitizeField(exp, "duration");
      exp.bullets = exp.bullets.map(escapeLatex);
    });

    clean.projects.forEach((proj) => {
      sanitizeField(proj, "title");
      sanitizeField(proj, "subtitle");
      sanitizeField(proj, "date");
      proj.bullets = proj.bullets.map(escapeLatex);
    });

    Object.keys(clean.skills).forEach((key) => {
      sanitizeField(clean.skills, key);
    });

    // Sanitize Layout Settings - enforce valid dimensions
    Object.keys(clean.layout).forEach((key) => {
      // cast key to keyof LayoutSettings to avoid TS errors if possible, or just string access is fine since we deep cloned
      const k = key as keyof typeof clean.layout;
      clean.layout[k] = fixLatexDimension(String(clean.layout[k]));
    });

    return clean;
  };

  // Auto-generate LaTeX effect removed in favor of manual button
  useEffect(() => {
    if (resume) {
      setValidation(validateResume(resume));
    }
  }, [resume]);

  if (!resume)
    return (
      <div className="flex items-center justify-center h-screen text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          Loading...
        </div>
      </div>
    );

  /* ---------- Handlers ---------- */
  const updateResumeField = (field: keyof Resume, value: any) => {
    setResume({ ...resume, [field]: value });
  };

  const updateSkills = (field: keyof typeof resume.skills, value: string) => {
    setResume({ ...resume, skills: { ...resume.skills, [field]: value } });
  };

  const updateLayout = (field: keyof Resume["layout"], value: string) => {
    setResume({ ...resume, layout: { ...resume.layout, [field]: value } });
  };

  const handleSocialChange = (index: number, partial: Partial<SocialLink>) => {
    const links = [...resume.social_links];
    links[index] = { ...links[index], ...partial };
    setResume({ ...resume, social_links: links });
  };

  const addSocialLink = () => {
    if (resume.social_links.length >= 4) {
      alert("Max 4 links allowed.");
      return;
    }
    setResume({
      ...resume,
      social_links: [...resume.social_links, { name: "", url: "" }],
    });
  };

  const removeSocialLink = (index: number) => {
    setResume({
      ...resume,
      social_links: resume.social_links.filter((_, i) => i !== index),
    });
  };

  const updateArrayItem = <T,>(
    arr: T[],
    index: number,
    updates: Partial<T>
  ) => {
    const copy = [...arr];
    copy[index] = { ...copy[index], ...updates };
    return copy;
  };

  const removeArrayItem = <T,>(arr: T[], index: number) => {
    const copy = [...arr];
    copy.splice(index, 1);
    return copy;
  };

  const handleEducationChange = (
    index: number,
    entry: Partial<EducationEntry>
  ) => {
    setResume({
      ...resume,
      education: updateArrayItem(resume.education, index, entry),
    });
  };

  const handleExperienceChange = (
    index: number,
    entry: Partial<ExperienceEntry>
  ) => {
    setResume({
      ...resume,
      experiences: updateArrayItem(resume.experiences, index, entry),
    });
  };

  const handleProjectChange = (index: number, entry: Partial<Project>) => {
    setResume({
      ...resume,
      projects: updateArrayItem(resume.projects, index, entry),
    });
  };

  const handleSave = async () => await saveResume(resume);

  const handleFullResumeApply = (newResume: Resume) => {
    setResume(newResume);
  };

  const handleGeneratePreview = () => {
    if (resume) {
      const cleanResume = sanitizeResume(resume);
      renderLatex(cleanResume).then(setLatex).catch(console.error);
    }
  };

  const handleDownloadPdf = async () => {
    if (!validation.ok) {
      alert(
        "Please check the 'Action Required' block in the editor for validation errors before downloading."
      );
      return;
    }
    setDownloading(true);
    try {
      // Use sanitized resume for PDF generation
      const cleanResume = sanitizeResume(resume);
      const blob = await renderPdf(cleanResume);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.name.replace(/\s+/g, "_")}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Small delay to ensure download starts before revoking
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (err: any) {
      console.error("PDF error", err);
      alert(`Failed to generate PDF. Error: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // Nav Items Configuration
  const navItems = [
    { id: "personal", label: "Personal Info", icon: <IconP /> },
    { id: "summary", label: "Summary", icon: <IconSum /> },
    { id: "education", label: "Education", icon: <IconE /> },
    { id: "experience", label: "Work Experience", icon: <IconX /> },
    { id: "projects", label: "Projects", icon: <IconPr /> },
    { id: "skills", label: "Skills", icon: <IconS /> },
    { id: "layout", label: "Layout Settings", icon: <IconL /> },
  ];

  const buttonsDisabled = !validation.ok;

  return (
    <div className="app-container">
      {/* Top Header - Minimal */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-indigo-200 shadow-lg">
            H
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 m-0 leading-tight">
              HireOnRank
            </h1>
            <p className="text-xs text-slate-500 m-0 font-medium tracking-wide">
              RESUME BUILDER
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary text-sm" onClick={handleSave}>
            Save Progress
          </button>
          <button
            className="btn btn-secondary text-sm"
            onClick={handleGeneratePreview}>
            LaTeX Preview
          </button>
          <button
            className="btn btn-primary text-sm shadow-indigo-200 shadow-md"
            disabled={downloading}
            style={{ opacity: downloading ? 0.7 : 1 }}
            onClick={handleDownloadPdf}>
            {downloading ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </header>

      <div className="app-main">
        {/* Left Sidebar */}
        <aside className="nav-sidebar custom-scrollbar">
          <div className="mb-4 px-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Sections
            </h3>
            <div className="nav-grid">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`nav-item-card ${
                    activeSection === item.id ? "active" : ""
                  }`}
                  onClick={() => setActiveSection(item.id)}>
                  <div className="nav-icon-container">{item.icon}</div>
                  <span className="nav-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Editor */}
        <main className="editor-area custom-scrollbar">
          <div className="editor-card">
            {!validation.ok && validation.messages.length > 0 && (
              <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg mb-6 text-sm flex flex-col gap-1">
                <span className="font-bold flex items-center gap-2">
                  <span className="text-xl">!</span> Action Required
                </span>
                <ul className="list-disc pl-5 m-0 text-slate-600">
                  {validation.messages.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dynamic Section Rendering */}
            {activeSection === "personal" && (
              <ResumeSection
                title="Personal Information"
                description="Start with the basics. Employers need to know who you are and how to contact you."
                icon={<IconP />}
                isOpen={true}
                onToggle={() => {}}
                badge="Required">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Full Name"
                    value={resume.name}
                    onChange={(e) => updateResumeField("name", e.target.value)}
                    placeholder="e.g. John Doe"
                  />
                  <FormInput
                    label="Job Title"
                    value={resume.title}
                    onChange={(e) => updateResumeField("title", e.target.value)}
                    aiContext="Job Title"
                    placeholder="e.g. Software Engineer"
                  />
                  <FormInput
                    label="Phone"
                    value={resume.phone}
                    onChange={(e) => updateResumeField("phone", e.target.value)}
                    placeholder="+1 234 567 890"
                  />
                  <FormInput
                    label="Email"
                    value={resume.email}
                    onChange={(e) => updateResumeField("email", e.target.value)}
                    placeholder="john@example.com"
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
                        className="btn btn-ghost text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors"
                        onClick={() => removeSocialLink(i)}
                        title="Remove Link">
                        <svg
                          width="18"
                          height="18"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
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
            )}

            {activeSection === "summary" && (
              <ResumeSection
                title="Professional Summary"
                description="Write a short summary of your background and career goals."
                icon={<IconSum />}
                isOpen={true}
                onToggle={() => {}}
                badge="Required">
                <FormInput
                  textarea
                  label="Summary"
                  value={resume.summary}
                  onChange={(e) => updateResumeField("summary", e.target.value)}
                  aiContext="Professional Resume Summary"
                  placeholder="Experienced software developer with a focus on..."
                  className="min-h-[200px]"
                />
              </ResumeSection>
            )}

            {activeSection === "education" && (
              <ResumeSection
                title="Education"
                description="Add your academic background."
                icon={<IconE />}
                isOpen={true}
                onToggle={() => {}}
                badge="Required">
                {resume.education.map((edu, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100 relative group">
                    <button
                      className="absolute top-3 right-3 text-red-500 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-all opacity-100 shadow-sm border border-red-100"
                      onClick={() =>
                        setResume({
                          ...resume,
                          education: removeArrayItem(resume.education, i),
                        })
                      }
                      title="Remove Entry">
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3">
                      Item {i + 1}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Institution"
                        value={edu.institution}
                        onChange={(e) =>
                          handleEducationChange(i, {
                            institution: e.target.value,
                          })
                        }
                        placeholder="University Name"
                      />
                      <FormInput
                        label="Degree"
                        value={edu.degree}
                        onChange={(e) =>
                          handleEducationChange(i, { degree: e.target.value })
                        }
                        placeholder="Bachelor of Science"
                      />
                      <FormInput
                        label="Grade/GPA"
                        value={edu.grade}
                        onChange={(e) =>
                          handleEducationChange(i, { grade: e.target.value })
                        }
                        placeholder="3.8/4.0"
                      />
                      <FormInput
                        label="Date Period"
                        value={edu.duration}
                        onChange={(e) =>
                          handleEducationChange(i, { duration: e.target.value })
                        }
                        placeholder="Sep 2018 - Jun 2022"
                      />
                    </div>
                  </div>
                ))}
                <button
                  className="btn btn-primary w-full shadow-lg shadow-indigo-100"
                  onClick={() =>
                    setResume({
                      ...resume,
                      education: [
                        ...resume.education,
                        {
                          degree: "",
                          grade: "",
                          institution: "",
                          duration: "",
                        },
                      ],
                    })
                  }>
                  + Add Education
                </button>
              </ResumeSection>
            )}

            {activeSection === "experience" && (
              <ResumeSection
                title="Work Experience"
                description="List your relevant work experience, starting with the most recent."
                icon={<IconX />}
                isOpen={true}
                onToggle={() => {}}>
                {resume.experiences.map((exp, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100 relative group">
                    <button
                      className="absolute top-3 right-3 text-red-500 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-all opacity-100 shadow-sm border border-red-100"
                      onClick={() =>
                        setResume({
                          ...resume,
                          experiences: removeArrayItem(resume.experiences, i),
                        })
                      }
                      title="Remove Entry">
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <FormInput
                        label="Job Role"
                        value={exp.role}
                        onChange={(e) =>
                          handleExperienceChange(i, { role: e.target.value })
                        }
                        aiContext="Job Role Title"
                        placeholder="Software Engineer"
                      />
                      <FormInput
                        label="Company"
                        value={exp.org}
                        onChange={(e) =>
                          handleExperienceChange(i, { org: e.target.value })
                        }
                        placeholder="Acme Corp"
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
                            className="btn btn-ghost text-slate-400 hover:text-red-500"
                            onClick={() => {
                              const newBullets = [...exp.bullets];
                              newBullets.splice(bi, 1);
                              handleExperienceChange(i, {
                                bullets: newBullets,
                              });
                            }}>
                            ×
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
                  onClick={() =>
                    setResume({
                      ...resume,
                      experiences: [
                        ...resume.experiences,
                        {
                          role: "",
                          org: "",
                          location: "",
                          duration: "",
                          bullets: [""],
                        },
                      ],
                    })
                  }>
                  + Add Experience
                </button>
              </ResumeSection>
            )}

            {activeSection === "projects" && (
              <ResumeSection
                title="Projects"
                description="Showcase your best work."
                icon={<IconPr />}
                isOpen={true}
                onToggle={() => {}}>
                {resume.projects.map((proj, i) => (
                  <div
                    key={i}
                    className="bg-slate-50 p-4 rounded-lg mb-6 border border-slate-100 relative group">
                    <button
                      className="absolute top-3 right-3 text-red-500 bg-red-50 hover:bg-red-100 p-1.5 rounded-md transition-all opacity-100 shadow-sm border border-red-100"
                      onClick={() =>
                        setResume({
                          ...resume,
                          projects: removeArrayItem(resume.projects, i),
                        })
                      }
                      title="Remove Entry">
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <FormInput
                        label="Project Title"
                        value={proj.title}
                        onChange={(e) =>
                          handleProjectChange(i, { title: e.target.value })
                        }
                        placeholder="My Awesome App"
                      />
                      <FormInput
                        label="Date"
                        value={proj.date}
                        onChange={(e) =>
                          handleProjectChange(i, { date: e.target.value })
                        }
                        placeholder="2023"
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
                            className="btn btn-ghost text-slate-400 hover:text-red-500"
                            onClick={() => {
                              const newBullets = [...proj.bullets];
                              newBullets.splice(bi, 1);
                              handleProjectChange(i, { bullets: newBullets });
                            }}>
                            ×
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
                  onClick={() =>
                    setResume({
                      ...resume,
                      projects: [
                        ...resume.projects,
                        {
                          title: "",
                          subtitle: "",
                          date: "",
                          bullets: [""],
                          spacing_before: null,
                          spacing_after: null,
                        },
                      ],
                    })
                  }>
                  + Add Project
                </button>
              </ResumeSection>
            )}

            {activeSection === "skills" && (
              <ResumeSection
                title="Skills & Interests"
                icon={<IconS />}
                isOpen={true}
                onToggle={() => {}}>
                <div className="grid grid-cols-1 gap-5">
                  <FormInput
                    label="Languages"
                    value={resume.skills.languages}
                    onChange={(e) => updateSkills("languages", e.target.value)}
                    placeholder="Java, Python, C++"
                  />
                  <FormInput
                    label="Frameworks"
                    value={resume.skills.frameworks}
                    onChange={(e) => updateSkills("frameworks", e.target.value)}
                    placeholder="React, Spring Boot"
                  />
                  <FormInput
                    label="Tools"
                    value={resume.skills.web_tools}
                    onChange={(e) => updateSkills("web_tools", e.target.value)}
                    placeholder="Git, Docker, AWS"
                  />
                  <FormInput
                    label="Databases"
                    value={resume.skills.cloud_databases}
                    onChange={(e) =>
                      updateSkills("cloud_databases", e.target.value)
                    }
                    placeholder="PostgreSQL, MongoDB"
                  />
                  <FormInput
                    textarea
                    label="Relevant Coursework"
                    value={resume.skills.coursework}
                    onChange={(e) => updateSkills("coursework", e.target.value)}
                    placeholder="Data Structures, Algorithms..."
                  />
                </div>
              </ResumeSection>
            )}

            {activeSection === "layout" && (
              <ResumeSection
                title="Layout Settings"
                description="Fine-tune your resume's spacing."
                icon={<IconL />}
                isOpen={true}
                onToggle={() => {}}>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Section Spacing Top"
                    value={resume.layout.section_spacing_top}
                    onChange={(e) =>
                      updateLayout("section_spacing_top", e.target.value)
                    }
                  />
                  <FormInput
                    label="Section Spacing Bottom"
                    value={resume.layout.section_spacing_bottom}
                    onChange={(e) =>
                      updateLayout("section_spacing_bottom", e.target.value)
                    }
                  />
                  <FormInput
                    label="Section Spacing After"
                    value={resume.layout.section_spacing_after}
                    onChange={(e) =>
                      updateLayout("section_spacing_after", e.target.value)
                    }
                  />
                  <FormInput
                    label="Bullet Spacing"
                    value={resume.layout.bullet_spacing}
                    onChange={(e) =>
                      updateLayout("bullet_spacing", e.target.value)
                    }
                  />
                </div>
              </ResumeSection>
            )}
          </div>
        </main>

        {/* Right Preview Sidebar */}
        <aside className="preview-area">
          <div className="preview-header">
            <h3 className="text-sm font-bold text-slate-700 m-0">
              LaTeX Output Preview
            </h3>
          </div>
          <div className="preview-content custom-scrollbar">
            {latex || "Generating LaTeX preview..."}
          </div>
        </aside>
      </div>

      {/* AI Assistant - Floating Button & Drawer */}
      <AiAssistant onApplyResume={handleFullResumeApply} />
    </div>
  );
};

export default App;
