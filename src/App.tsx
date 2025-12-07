// src/App.tsx
import React, { useEffect, useState } from "react";
import { Resume, Project, EducationEntry, ExperienceEntry } from "./types";
import { fetchResume, saveResume, renderLatex, renderPdf } from "./api";

/* ---------- Shared styles ---------- */

const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  padding: 14,
  marginBottom: 12,
  background: "#ffffff",
  boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
  border: "1px solid #e5e7eb",
};

const sectionShell: React.CSSProperties = {
  marginBottom: 16,
  padding: 12,
  borderRadius: 14,
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
};

const sectionHeaderRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  gap: 10,
};

const sectionHeaderLeft: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
};

const badgeRequired: React.CSSProperties = {
  padding: "1px 7px",
  borderRadius: 9999,
  fontSize: 10,
  fontWeight: 600,
  background: "#fee2e2",
  color: "#b91c1c",
  textTransform: "uppercase",
};

const fieldWrapper: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  marginBottom: 10,
  fontSize: 13,
  gap: 4,
};

const labelStyle: React.CSSProperties = {
  fontWeight: 500,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  padding: "7px 9px",
  borderRadius: 7,
  border: "1px solid #d1d5db",
  fontSize: 13,
  outline: "none",
  background: "#f9fafb",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: "both",
  // display: "block",
  minWidth: "80%",
 
};

const btnBase: React.CSSProperties = {
  fontSize: 13,
  borderRadius: 9999,
  padding: "6px 14px",
  border: "none",
  cursor: "pointer",
  fontWeight: 500,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const primaryButton: React.CSSProperties = {
  ...btnBase,
  background: "#2563eb",
  color: "white",
};

const secondaryButton: React.CSSProperties = {
  ...btnBase,
  background: "#e5e7eb",
  color: "#111827",
};

const dangerButton: React.CSSProperties = {
  ...btnBase,
  background: "#fee2e2",
  color: "#b91c1c",
};

/* ---------- Validation ---------- */

type ValidationResult = {
  ok: boolean;
  messages: string[];
};

function validateResume(resume: Resume): ValidationResult {
  const messages: string[] = [];

  if (!resume.name.trim()) {
    messages.push("Name is required.");
  }
  if (!resume.title.trim()) {
    messages.push("Title is required.");
  }
  if (!resume.email.trim()) {
    messages.push("Email is required.");
  } else {
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    if (!emailRegex.test(resume.email.trim())) {
      messages.push("Email format looks invalid.");
    }
  }

  if (!resume.summary.trim()) {
    messages.push("Summary is required.");
  }

  if (!resume.education || resume.education.length === 0) {
    messages.push("At least one education entry is required.");
  } else {
    resume.education.forEach((e, idx) => {
      if (!e.degree.trim()) {
        messages.push(`Education #${idx + 1}: Degree is required.`);
      }
      if (!e.institution.trim()) {
        messages.push(`Education #${idx + 1}: Institution is required.`);
      }
    });
  }

  if (!resume.projects || resume.projects.length === 0) {
    messages.push("At least one project is recommended.");
  }

  return {
    ok: messages.length === 0,
    messages,
  };
}

/* ---------- Main component ---------- */

function App() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [latex, setLatex] = useState<string>("");
  const [validation, setValidation] = useState<ValidationResult>({
    ok: true,
    messages: [],
  });

  // Accordion open states
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [personalOpen, setPersonalOpen] = useState(true);
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [educationOpen, setEducationOpen] = useState(true);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(true);

  useEffect(() => {
    fetchResume()
      .then((data) => {
        const normalised: Resume = {
          name: data.name || "",
          title: data.title || "",
          phone: data.phone || "",
          email: data.email || "",
          summary: data.summary || "",
          education: data.education || [],
          projects: data.projects || [],
          experiences: data.experiences || [],
          skills: data.skills || {
            languages: "",
            libraries: "",
            web_tools: "",
            frameworks: "",
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

  useEffect(() => {
    if (resume) setValidation(validateResume(resume));
  }, [resume]);

  if (!resume) {
    return (
      <div
        style={{
          padding: 24,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        Loading…
      </div>
    );
  }

  /* ---------- Basic setters ---------- */

  const updateResumeField = (field: keyof Resume, value: any) => {
    const updated = { ...resume, [field]: value };
    setResume(updated);
  };

  const updateLayout = (field: keyof Resume["layout"], value: string) => {
    setResume({ ...resume, layout: { ...resume.layout, [field]: value } });
  };

  /* ---------- Education ---------- */

  const handleEducationChange = (
    index: number,
    entry: Partial<EducationEntry>
  ) => {
    const copy = [...resume.education];
    copy[index] = { ...copy[index], ...entry };
    setResume({ ...resume, education: copy });
  };

  const addEducation = () => {
    const newEntry: EducationEntry = {
      degree: "",
      grade: "",
      institution: "",
      duration: "",
    };
    setResume({ ...resume, education: [...resume.education, newEntry] });
  };

  const removeEducation = (index: number) => {
    const copy = [...resume.education];
    copy.splice(index, 1);
    setResume({ ...resume, education: copy });
  };

  /* ---------- Experience ---------- */

  const handleExperienceChange = (
    index: number,
    entry: Partial<ExperienceEntry>
  ) => {
    const copy = [...resume.experiences];
    copy[index] = { ...copy[index], ...entry };
    setResume({ ...resume, experiences: copy });
  };

  const addExperience = () => {
    const newEntry: ExperienceEntry = {
      role: "",
      org: "",
      location: "",
      duration: "",
      bullets: [""],
    };
    setResume({ ...resume, experiences: [...resume.experiences, newEntry] });
  };

  const removeExperience = (index: number) => {
    const copy = [...resume.experiences];
    copy.splice(index, 1);
    setResume({ ...resume, experiences: copy });
  };

  /* ---------- Projects ---------- */

  const handleProjectChange = (index: number, project: Partial<Project>) => {
    const copy = [...resume.projects];
    copy[index] = { ...copy[index], ...project };
    setResume({ ...resume, projects: copy });
  };

  const addProject = () => {
    const newProject: Project = {
      title: "",
      subtitle: "",
      date: "",
      bullets: [""],
      spacing_before: null,
      spacing_after: null,
    };
    setResume({ ...resume, projects: [...resume.projects, newProject] });
  };

  const removeProject = (index: number) => {
    const copy = [...resume.projects];
    copy.splice(index, 1);
    setResume({ ...resume, projects: copy });
  };

  /* ---------- Actions ---------- */

  const handleSave = async () => {
    await saveResume(resume);
  };

  const handleGenerateLatex = async () => {
    if (!validation.ok) {
      alert("Fix validation issues first.");
      return;
    }
    const tex = await renderLatex(resume);
    setLatex(tex);
  };

  const handleDownloadPdf = async () => {
    if (!validation.ok) {
      alert("Fix validation issues first.");
      return;
    }
    try {
      const blob = await renderPdf(resume);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "resume.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF error", err);
      alert("Failed to generate PDF. Check console / backend logs.");
    }
  };

  /* ---------- UI helpers ---------- */

  const renderChevron = (open: boolean) => (
    <span
      style={{
        fontSize: 18,
        color: "#6b7280",
        transform: open ? "rotate(0deg)" : "rotate(-90deg)",
        transition: "transform 0.15s ease-out",
      }}
    >
      ▾
    </span>
  );

  const iconCircle = (symbol: string, bg: string, fg: string) => ({
    width: 28,
    height: 28,
    borderRadius: "9999px",
    background: bg,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
    fontWeight: 700,
    color: fg,
  });

  /* ---------- Render ---------- */

  const buttonsDisabled = !validation.ok;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: "#f3f4f6",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          padding: "10px 20px",
          borderBottom: "1px solid #e5e7eb",
          background: "#ffffffcc",
          backdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "#111827" }}>
            LaTeX Resume Builder
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Edit structured fields on the left, preview LaTeX on the right.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={secondaryButton} onClick={handleSave}>
            Save JSON
          </button>
          <button
            style={{
              ...primaryButton,
              opacity: buttonsDisabled ? 0.6 : 1,
              cursor: buttonsDisabled ? "not-allowed" : "pointer",
            }}
            disabled={buttonsDisabled}
            onClick={handleGenerateLatex}
          >
            Generate LaTeX
          </button>
          <button
            style={{
              ...secondaryButton,
              opacity: buttonsDisabled ? 0.6 : 1,
              cursor: buttonsDisabled ? "not-allowed" : "pointer",
            }}
            disabled={buttonsDisabled}
            onClick={handleDownloadPdf}
          >
            Download PDF
          </button>
        </div>
      </header>

      {/* Main content */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: editor */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            padding: 16,
            overflowY: "auto",
          }}
        >
          {/* Validation panel */}
          {!validation.ok && validation.messages.length > 0 && (
            <div
              style={{
                marginBottom: 16,
                padding: 10,
                borderRadius: 8,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Please fix the following:
              </div>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {validation.messages.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Personal Information */}
          <div style={sectionShell}>
            <div
              style={sectionHeaderRow}
              onClick={() => setPersonalOpen(!personalOpen)}
            >
              <div style={sectionHeaderLeft}>
                <div
                  style={iconCircle("P", "#dbeafe", "#1d4ed8")}
                >
                  P
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#111827" }}>
                    Personal Information
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Name, title, and contact details.
                  </div>
                </div>
                <span style={badgeRequired}>Required</span>
              </div>
              {renderChevron(personalOpen)}
            </div>

            {personalOpen && (
              <div style={{ marginTop: 10 }}>
                <div style={fieldWrapper}>
                  <span style={labelStyle}>Name</span>
                  <input
                    style={inputStyle}
                    value={resume.name}
                    onChange={(e) => updateResumeField("name", e.target.value)}
                  />
                </div>
                <div style={fieldWrapper}>
                  <span style={labelStyle}>Title</span>
                  <input
                    style={inputStyle}
                    value={resume.title}
                    onChange={(e) => updateResumeField("title", e.target.value)}
                    placeholder="Software Engineer, Data Scientist, etc."
                  />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ ...fieldWrapper, flex: 1 }}>
                    <span style={labelStyle}>Phone</span>
                    <input
                      style={inputStyle}
                      value={resume.phone}
                      onChange={(e) =>
                        updateResumeField("phone", e.target.value)
                      }
                    />
                  </div>
                  <div style={{ ...fieldWrapper, flex: 1 }}>
                    <span style={labelStyle}>Email</span>
                    <input
                      style={inputStyle}
                      value={resume.email}
                      onChange={(e) =>
                        updateResumeField("email", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Layout & Spacing */}
          <div style={sectionShell}>
            <div
              style={sectionHeaderRow}
              onClick={() => setLayoutOpen(!layoutOpen)}
            >
              <div style={sectionHeaderLeft}>
                <div
                  style={iconCircle("L", "#fee2e2", "#b91c1c")}
                >
                  L
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#111827" }}>
                    Layout & Spacing
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Fine-tune vertical spacing between sections and bullets.
                  </div>
                </div>
              </div>
              {renderChevron(layoutOpen)}
            </div>

            {layoutOpen && (
              <div style={{ marginTop: 10 }}>
                <div style={fieldWrapper}>
                  <span style={labelStyle}>Section spacing (top)</span>
                  <input
                    style={inputStyle}
                    value={resume.layout.section_spacing_top}
                    onChange={(e) =>
                      updateLayout("section_spacing_top", e.target.value)
                    }
                    placeholder="e.g. 2mm"
                  />
                </div>
                <div style={fieldWrapper}>
                  <span style={labelStyle}>Section spacing (bottom)</span>
                  <input
                    style={inputStyle}
                    value={resume.layout.section_spacing_bottom}
                    onChange={(e) =>
                      updateLayout("section_spacing_bottom", e.target.value)
                    }
                    placeholder="e.g. 2mm"
                  />
                </div>
                <div style={fieldWrapper}>
                  <span style={labelStyle}>Spacing after each section</span>
                  <input
                    style={inputStyle}
                    value={resume.layout.section_spacing_after}
                    onChange={(e) =>
                      updateLayout("section_spacing_after", e.target.value)
                    }
                    placeholder="e.g. -5mm, 0mm, 3mm"
                  />
                </div>
                <div style={fieldWrapper}>
                  <span style={labelStyle}>Bullet spacing</span>
                  <input
                    style={inputStyle}
                    value={resume.layout.bullet_spacing}
                    onChange={(e) =>
                      updateLayout("bullet_spacing", e.target.value)
                    }
                    placeholder="e.g. 0mm or 1mm"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Summary */}
          <div style={sectionShell}>
            <div
              style={sectionHeaderRow}
              onClick={() => setSummaryOpen(!summaryOpen)}
            >
              <div style={sectionHeaderLeft}>
                <div
                  style={iconCircle("Σ", "#dcfce7", "#15803d")}
                >
                  Σ
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#111827" }}>
                    Summary
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    2–4 line snapshot recruiters read first.
                  </div>
                </div>
                <span style={badgeRequired}>Required</span>
              </div>
              {renderChevron(summaryOpen)}
            </div>

            {summaryOpen && (
              <div style={{ marginTop: 10 }}>
                <textarea
                  style={{
                    ...textareaStyle,
                    minHeight: 260,
                    lineHeight: 1.6,
                    fontSize: 13,
                  }}
                  placeholder={`Example:
Final-year CS student with strong backend + cloud experience. 
Built 3+ production web apps using Django, React, and PostgreSQL. 
Interested in backend / platform roles with focus on reliability and performance.`}
                  value={resume.summary}
                  onChange={(e) =>
                    updateResumeField("summary", e.target.value)
                  }
                />

                <div
                  style={{
                    marginTop: 6,
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    fontSize: 11,
                  }}
                >
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 9999,
                      background: "#e5e7eb",
                      color: "#374151",
                    }}
                  >
                    Keep it 3–5 sentences
                  </span>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 9999,
                      background: "#e5e7eb",
                      color: "#374151",
                    }}
                  >
                    Mention tech stack + impact
                  </span>
                  <span
                    style={{
                      padding: "3px 8px",
                      borderRadius: 9999,
                      background: "#e5e7eb",
                      color: "#374151",
                    }}
                  >
                    Tailor to the role you want
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Education */}
          <div style={sectionShell}>
            <div
              style={sectionHeaderRow}
              onClick={() => setEducationOpen(!educationOpen)}
            >
              <div style={sectionHeaderLeft}>
                <div
                  style={iconCircle("E", "#e0f2fe", "#0369a1")}
                >
                  E
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#111827" }}>
                    Education
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Degrees, institutions, and durations.
                  </div>
                </div>
                <span style={badgeRequired}>Required</span>
              </div>
              {renderChevron(educationOpen)}
            </div>

            {educationOpen && (
              <div style={{ marginTop: 10 }}>
                {resume.education.map((e, i) => (
                  <div key={i} style={cardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <strong>Entry {i + 1}</strong>
                      <button
                        type="button"
                        style={{
                          ...dangerButton,
                          opacity: resume.education.length === 1 ? 0.4 : 1,
                          cursor:
                            resume.education.length === 1
                              ? "not-allowed"
                              : "pointer",
                        }}
                        onClick={() => removeEducation(i)}
                        disabled={resume.education.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                    <div style={fieldWrapper}>
                      <span style={labelStyle}>Degree</span>
                      <input
                        style={inputStyle}
                        value={e.degree}
                        placeholder="Bachelor of Technology in ..."
                        onChange={(ev) =>
                          handleEducationChange(i, { degree: ev.target.value })
                        }
                      />
                    </div>
                    <div style={fieldWrapper}>
                      <span style={labelStyle}>Grade</span>
                      <input
                        style={inputStyle}
                        value={e.grade}
                        placeholder="CGPA: xx"
                        onChange={(ev) =>
                          handleEducationChange(i, { grade: ev.target.value })
                        }
                      />
                    </div>
                    <div style={fieldWrapper}>
                      <span style={labelStyle}>Institution</span>
                      <input
                        style={inputStyle}
                        value={e.institution}
                        onChange={(ev) =>
                          handleEducationChange(i, {
                            institution: ev.target.value,
                          })
                        }
                      />
                    </div>
                    <div style={fieldWrapper}>
                      <span style={labelStyle}>Duration</span>
                      <input
                        style={inputStyle}
                        value={e.duration}
                        placeholder="2020–24"
                        onChange={(ev) =>
                          handleEducationChange(i, {
                            duration: ev.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  style={secondaryButton}
                  onClick={addEducation}
                >
                  + Add education entry
                </button>
              </div>
            )}
          </div>

          {/* Experience */}
          <div style={sectionShell}>
            <div
              style={sectionHeaderRow}
              onClick={() => setExperienceOpen(!experienceOpen)}
            >
              <div style={sectionHeaderLeft}>
                <div
                  style={iconCircle("X", "#fef3c7", "#b45309")}
                >
                  X
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#111827" }}>
                    Experience
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Internships, jobs, and responsibilities.
                  </div>
                </div>
              </div>
              {renderChevron(experienceOpen)}
            </div>

            {experienceOpen && (
              <div style={{ marginTop: 10 }}>
                {resume.experiences.map((exp, i) => (
                  <div key={i} style={cardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <strong>Experience {i + 1}</strong>
                      <button
                        type="button"
                        style={{
                          ...dangerButton,
                          opacity: resume.experiences.length === 1 ? 0.4 : 1,
                          cursor:
                            resume.experiences.length === 1
                              ? "not-allowed"
                              : "pointer",
                        }}
                        onClick={() => removeExperience(i)}
                        disabled={resume.experiences.length === 1}
                      >
                        Remove
                      </button>
                    </div>

                    <div style={fieldWrapper}>
                      <span style={labelStyle}>Role</span>
                      <input
                        style={inputStyle}
                        value={exp.role}
                        onChange={(ev) =>
                          handleExperienceChange(i, { role: ev.target.value })
                        }
                      />
                    </div>
                    <div style={fieldWrapper}>
                      <span style={labelStyle}>Organisation</span>
                      <input
                        style={inputStyle}
                        value={exp.org}
                        onChange={(ev) =>
                          handleExperienceChange(i, { org: ev.target.value })
                        }
                      />
                    </div>
                    <div style={fieldWrapper}>
                      <span style={labelStyle}>Location</span>
                      <input
                        style={inputStyle}
                        value={exp.location}
                        onChange={(ev) =>
                          handleExperienceChange(i, {
                            location: ev.target.value,
                          })
                        }
                      />
                    </div>
                    <div style={fieldWrapper}>
                      <span style={labelStyle}>Duration</span>
                      <input
                        style={inputStyle}
                        value={exp.duration}
                        onChange={(ev) =>
                          handleExperienceChange(i, {
                            duration: ev.target.value,
                          })
                        }
                      />
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <div style={{ marginBottom: 4, fontWeight: 500 }}>
                        Bullets
                      </div>
                      {exp.bullets.map((b, bi) => (
                        <div key={bi} style={{ display: "flex", gap: 4 }}>
                          <input
                            style={{ ...inputStyle, flex: 1 }}
                            value={b}
                            onChange={(ev) => {
                              const bullets = [...exp.bullets];
                              bullets[bi] = ev.target.value;
                              handleExperienceChange(i, { bullets });
                            }}
                          />
                          <button
                            type="button"
                            style={{ ...secondaryButton, padding: "0 10px" }}
                            onClick={() => {
                              const bullets = [...exp.bullets];
                              bullets.splice(bi, 1);
                              handleExperienceChange(i, { bullets });
                            }}
                            disabled={exp.bullets.length === 1}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        style={{ ...secondaryButton, marginTop: 4 }}
                        onClick={() => {
                          const bullets = [...exp.bullets, ""];
                          handleExperienceChange(i, { bullets });
                        }}
                      >
                        + Add bullet
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  style={secondaryButton}
                  onClick={addExperience}
                >
                  + Add experience entry
                </button>
              </div>
            )}
          </div>

          {/* Skills & Interests */}
          <div style={sectionShell}>
            <div
              style={sectionHeaderRow}
              onClick={() => setSkillsOpen(!skillsOpen)}
            >
              <div style={sectionHeaderLeft}>
                <div
                  style={iconCircle("S", "#ede9fe", "#6d28d9")}
                >
                  S
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#111827" }}>
                    Skills & Interests
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Languages, frameworks, and soft skills.
                  </div>
                </div>
              </div>
              {renderChevron(skillsOpen)}
            </div>

            {skillsOpen && (
              <div style={{ marginTop: 10 }}>
                <div style={fieldWrapper}>
                  <span style={labelStyle}>Languages</span>
                  <input
                    style={inputStyle}
                    value={resume.skills.languages}
                    onChange={(e) =>
                      setResume({
                        ...resume,
                        skills: {
                          ...resume.skills,
                          languages: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div style={fieldWrapper}>
                  <span style={labelStyle}>Libraries</span>
                  <input
                    style={inputStyle}
                    value={resume.skills.libraries}
                    onChange={(e) =>
                      setResume({
                        ...resume,
                        skills: {
                          ...resume.skills,
                          libraries: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div style={fieldWrapper}>
                  <span style={labelStyle}>Web Dev Tools</span>
                  <input
                    style={inputStyle}
                    value={resume.skills.web_tools}
                    onChange={(e) =>
                      setResume({
                        ...resume,
                        skills: {
                          ...resume.skills,
                          web_tools: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div style={fieldWrapper}>
                  <span style={labelStyle}>Frameworks</span>
                  <input
                    style={inputStyle}
                    value={resume.skills.frameworks}
                    onChange={(e) =>
                      setResume({
                        ...resume,
                        skills: {
                          ...resume.skills,
                          frameworks: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div style={fieldWrapper}>
                  <span style={labelStyle}>Cloud / Databases</span>
                  <input
                    style={inputStyle}
                    value={resume.skills.cloud_databases}
                    onChange={(e) =>
                      setResume({
                        ...resume,
                        skills: {
                          ...resume.skills,
                          cloud_databases: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div style={fieldWrapper}>
                  <span style={labelStyle}>Relevant Coursework</span>
                  <textarea
                    style={textareaStyle}
                    value={resume.skills.coursework}
                    onChange={(e) =>
                      setResume({
                        ...resume,
                        skills: {
                          ...resume.skills,
                          coursework: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div style={fieldWrapper}>
                  <span style={labelStyle}>Areas of Interest</span>
                  <textarea
                    style={textareaStyle}
                    value={resume.skills.areas_of_interest}
                    onChange={(e) =>
                      setResume({
                        ...resume,
                        skills: {
                          ...resume.skills,
                          areas_of_interest: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div style={fieldWrapper}>
                  <span style={labelStyle}>Soft Skills</span>
                  <textarea
                    style={textareaStyle}
                    value={resume.skills.soft_skills}
                    onChange={(e) =>
                      setResume({
                        ...resume,
                        skills: {
                          ...resume.skills,
                          soft_skills: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Projects */}
          <div style={sectionShell}>
            <div
              style={sectionHeaderRow}
              onClick={() => setProjectsOpen(!projectsOpen)}
            >
              <div style={sectionHeaderLeft}>
                <div
                  style={iconCircle("Pr", "#cffafe", "#0f766e")}
                >
                  Pr
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#111827" }}>
                    Projects
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Hands-on work that demonstrates skills.
                  </div>
                </div>
              </div>
              {renderChevron(projectsOpen)}
            </div>

            {projectsOpen && (
              <div style={{ marginTop: 10 }}>
                {resume.projects.map((p, i) => (
                  <div key={i} style={cardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <strong>Project {i + 1}</strong>
                      <button
                        type="button"
                        style={{
                          ...dangerButton,
                          opacity: resume.projects.length === 1 ? 0.4 : 1,
                          cursor:
                            resume.projects.length === 1
                              ? "not-allowed"
                              : "pointer",
                        }}
                        onClick={() => removeProject(i)}
                        disabled={resume.projects.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                    <div style={fieldWrapper}>
                      <span style={labelStyle}>Title</span>
                      <input
                        style={inputStyle}
                        placeholder="Project title"
                        value={p.title}
                        onChange={(e) =>
                          handleProjectChange(i, { title: e.target.value })
                        }
                      />
                    </div>
                    <div style={fieldWrapper}>
                      <span style={labelStyle}>Subtitle / Description</span>
                      <textarea
                        style={{ ...textareaStyle, minHeight: 80 }}
                        placeholder="Short description"
                        value={p.subtitle}
                        onChange={(e) =>
                          handleProjectChange(i, { subtitle: e.target.value })
                        }
                      />
                    </div>
                    <div style={fieldWrapper}>
                      <span style={labelStyle}>Date</span>
                      <input
                        style={inputStyle}
                        placeholder="e.g. 2023"
                        value={p.date}
                        onChange={(e) =>
                          handleProjectChange(i, { date: e.target.value })
                        }
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 8,
                        marginTop: 4,
                      }}
                    >
                      <div style={{ ...fieldWrapper, flex: 1 }}>
                        <span style={labelStyle}>Spacing before</span>
                        <input
                          style={inputStyle}
                          value={p.spacing_before || ""}
                          onChange={(e) =>
                            handleProjectChange(i, {
                              spacing_before: e.target.value || null,
                            })
                          }
                          placeholder="e.g. 2mm"
                        />
                      </div>
                      <div style={{ ...fieldWrapper, flex: 1 }}>
                        <span style={labelStyle}>Spacing after</span>
                        <input
                          style={inputStyle}
                          value={p.spacing_after || ""}
                          onChange={(e) =>
                            handleProjectChange(i, {
                              spacing_after: e.target.value || null,
                            })
                          }
                          placeholder="e.g. 2mm"
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <div style={{ marginBottom: 4, fontWeight: 500 }}>
                        Bullets
                      </div>
                      {p.bullets.map((b, bi) => (
                        <div key={bi} style={{ display: "flex", gap: 4 }}>
                          <input
                            style={{ ...inputStyle, flex: 1 }}
                            value={b}
                            onChange={(e) => {
                              const bullets = [...p.bullets];
                              bullets[bi] = e.target.value;
                              handleProjectChange(i, { bullets });
                            }}
                          />
                          <button
                            type="button"
                            style={{ ...secondaryButton, padding: "0 10px" }}
                            onClick={() => {
                              const bullets = [...p.bullets];
                              bullets.splice(bi, 1);
                              handleProjectChange(i, { bullets });
                            }}
                            disabled={p.bullets.length === 1}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        style={{ ...secondaryButton, marginTop: 4 }}
                        onClick={() => {
                          const bullets = [...p.bullets, ""];
                          handleProjectChange(i, { bullets });
                        }}
                      >
                        + Add bullet
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  style={secondaryButton}
                  onClick={addProject}
                >
                  + Add project
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: LaTeX preview */}
        <div
          style={{
            flexBasis: "45%",
            maxWidth: "45%",
            borderLeft: "1px solid #e5e7eb",
            padding: 16,
            background: "#020617",
            color: "#e5e7eb",
            overflow: "auto",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 8, color: "#f9fafb" }}>
            LaTeX Output
          </h3>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              fontSize: 12,
              background: "#020617",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #111827",
            }}
          >
            {latex || "% Click 'Generate LaTeX' to preview output here."}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default App;
