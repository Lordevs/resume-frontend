import React, { useEffect, useState } from "react";
import { Resume, Project, EducationEntry, ExperienceEntry, SocialLink } from "./types";
import { fetchResume, saveResume, renderLatex, renderPdf } from "./api";
import AiAssistant from "./components/AiAssistant";
import { ResumeSection } from "./components/ResumeSection";
import { FormInput } from "./components/FormInput";
import "./App.css";

// Helper Icons
const IconP = () => <div className="icon-circle" style={{ background: "#dbeafe", color: "#1d4ed8" }}>P</div>;
const IconE = () => <div className="icon-circle" style={{ background: "#e0f2fe", color: "#0369a1" }}>E</div>;
const IconX = () => <div className="icon-circle" style={{ background: "#fef3c7", color: "#b45309" }}>X</div>;
const IconS = () => <div className="icon-circle" style={{ background: "#ede9fe", color: "#6d28d9" }}>S</div>;
const IconPr = () => <div className="icon-circle" style={{ background: "#cffafe", color: "#0f766e" }}>Pr</div>;
const IconL = () => <div className="icon-circle" style={{ background: "#fee2e2", color: "#b91c1c" }}>L</div>;
const IconSum = () => <div className="icon-circle" style={{ background: "#dcfce7", color: "#15803d" }}>Σ</div>;

interface ValidationResult {
  ok: boolean;
  messages: string[];
}

const validateResume = (resume: Resume): ValidationResult => {
  const messages: string[] = [];
  if (!resume.name.trim()) messages.push("Name is required.");
  if (!resume.email.trim()) messages.push("Email is required.");
  if (!resume.summary.trim()) messages.push("Summary is required.");
  if (resume.education.length === 0) messages.push("At least one education entry is required.");
  if (resume.education.some((e) => !e.institution.trim()))
    messages.push("All education entries need an institution.");
  return { ok: messages.length === 0, messages };
};

const App: React.FC = () => {
  const [resume, setResume] = useState<Resume | null>(null);
  const [latex, setLatex] = useState<string>("");
  const [validation, setValidation] = useState<ValidationResult>({ ok: true, messages: [] });
  const [downloading, setDownloading] = useState(false);

  // Section States
  const [personalOpen, setPersonalOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [educationOpen, setEducationOpen] = useState(false);
  const [experienceOpen, setExperienceOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [layoutOpen, setLayoutOpen] = useState(false);

  useEffect(() => {
    fetchResume()
      .then((data) => {
        // Normalise data
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

  useEffect(() => {
    if (resume) setValidation(validateResume(resume));
  }, [resume]);

  if (!resume) return <div className="flex items-center justify-center h-screen">Loading...</div>;

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
    // NOTE: Logic adjusted to allow up to 4 for better responsiveness test, though backend might limit it.
    if (resume.social_links.length >= 4) {
      alert("Max 4 links allowed.");
      return;
    }
    setResume({ ...resume, social_links: [...resume.social_links, { name: "", url: "" }] });
  };

  const removeSocialLink = (index: number) => {
    setResume({ ...resume, social_links: resume.social_links.filter((_, i) => i !== index) });
  };

  // Generic Array Helpers
  const updateArrayItem = <T,>(arr: T[], index: number, updates: Partial<T>) => {
    const copy = [...arr];
    copy[index] = { ...copy[index], ...updates };
    return copy;
  };

  const removeArrayItem = <T,>(arr: T[], index: number) => {
    const copy = [...arr];
    copy.splice(index, 1);
    return copy;
  };

  const handleEducationChange = (index: number, entry: Partial<EducationEntry>) => {
    setResume({ ...resume, education: updateArrayItem(resume.education, index, entry) });
  };

  const handleExperienceChange = (index: number, entry: Partial<ExperienceEntry>) => {
    setResume({ ...resume, experiences: updateArrayItem(resume.experiences, index, entry) });
  };

  const handleProjectChange = (index: number, entry: Partial<Project>) => {
    setResume({ ...resume, projects: updateArrayItem(resume.projects, index, entry) });
  };

  const handleFullResumeApply = (newResume: Resume) => {
    // Merge with default layout to ensure consistency if AI misses it
    const merged = {
      ...resume,
      ...newResume,
      layout: { ...resume.layout, ...(newResume.layout || {}) }
    };
    setResume(merged);
  };

  /* ---------- Actions ---------- */
  const handleSave = async () => await saveResume(resume);

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
    setDownloading(true);
    try {
      const blob = await renderPdf(resume);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${resume.name.replace(/\s+/g, '_')}_Resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF error", err);
      // alert("Failed to generate PDF."); // Optional: silent fail or toast
    } finally {
      setDownloading(false);
    }
  };

  const buttonsDisabled = !validation.ok;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div>
          <h1 className="text-xl font-bold text-slate-900 m-0">LaTeX Resume Builder</h1>
          <p className="text-sm text-slate-500 m-0">Edit fields on the left, preview on the right.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary" onClick={handleSave}>Save JSON</button>
          <button
            className="btn btn-primary"
            disabled={buttonsDisabled}
            style={{ opacity: buttonsDisabled ? 0.6 : 1 }}
            onClick={handleGenerateLatex}
          >
            Generate LaTeX
          </button>
          <button
            className="btn btn-secondary"
            disabled={buttonsDisabled || downloading}
            style={{ opacity: (buttonsDisabled || downloading) ? 0.6 : 1 }}
            onClick={handleDownloadPdf}
          >
            {downloading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </span>
            ) : "Download PDF"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Editor Pane */}
        <div className="editor-pane custom-scrollbar">

          {/* Validation Alert */}
          {!validation.ok && validation.messages.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-sm">
              <p className="font-bold mb-1">Please fix the following:</p>
              <ul className="list-disc pl-5 m-0">
                {validation.messages.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}

          {/* Personal Info */}
          <ResumeSection
            title="Personal Information"
            description="Name, title, and contact details."
            icon={<IconP />}
            isOpen={personalOpen}
            onToggle={() => setPersonalOpen(!personalOpen)}
            badge="Required"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput label="Name" value={resume.name} onChange={(e) => updateResumeField("name", e.target.value)} />
              <FormInput label="Title" value={resume.title} onChange={(e) => updateResumeField("title", e.target.value)} aiContext="Job Title" />
              <FormInput label="Phone" value={resume.phone} onChange={(e) => updateResumeField("phone", e.target.value)} />
              <FormInput label="Email" value={resume.email} onChange={(e) => updateResumeField("email", e.target.value)} />
            </div>

            <div className="mt-4">
              <label className="form-label">Links (e.g. LinkedIn, GitHub)</label>
              {resume.social_links.map((link, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <FormInput
                    placeholder="Label"
                    containerStyle={{ marginBottom: 0, flex: 1 }}
                    value={link.name}
                    onChange={(e) => handleSocialChange(i, { name: e.target.value })}
                  />
                  <FormInput
                    placeholder="URL"
                    containerStyle={{ marginBottom: 0, flex: 2 }}
                    value={link.url}
                    onChange={(e) => handleSocialChange(i, { url: e.target.value })}
                  />
                  <button className="btn btn-ghost text-red-500" onClick={() => removeSocialLink(i)}>×</button>
                </div>
              ))}
              <button className="btn btn-secondary text-xs" onClick={addSocialLink}>+ Add Link</button>
            </div>
          </ResumeSection>

          {/* Summary */}
          <ResumeSection
            title="Summary"
            description="A quick snapshot for recruiters."
            icon={<IconSum />}
            isOpen={summaryOpen}
            onToggle={() => setSummaryOpen(!summaryOpen)}
            badge="Required"
          >
            <FormInput
              textarea
              label="Professional Summary"
              value={resume.summary}
              onChange={(e) => updateResumeField("summary", e.target.value)}
              aiContext="Professional Resume Summary"
              placeholder="Briefly describe your experience and skills..."
            />
          </ResumeSection>

          {/* Education */}
          <ResumeSection
            title="Education"
            icon={<IconE />}
            isOpen={educationOpen}
            onToggle={() => setEducationOpen(!educationOpen)}
            badge="Required"
          >
            {resume.education.map((edu, i) => (
              <div key={i} className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-700">Entry {i + 1}</span>
                  <button className="btn btn-ghost text-red-500 text-xs" onClick={() => setResume({ ...resume, education: removeArrayItem(resume.education, i) })}>Remove</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="Degree" value={edu.degree} onChange={(e) => handleEducationChange(i, { degree: e.target.value })} />
                  <FormInput label="Grade/GPA" value={edu.grade} onChange={(e) => handleEducationChange(i, { grade: e.target.value })} />
                  <FormInput label="Institution" value={edu.institution} onChange={(e) => handleEducationChange(i, { institution: e.target.value })} />
                  <FormInput label="Duration" value={edu.duration} onChange={(e) => handleEducationChange(i, { duration: e.target.value })} />
                </div>
              </div>
            ))}
            <button className="btn btn-secondary w-full" onClick={() => setResume({ ...resume, education: [...resume.education, { degree: "", grade: "", institution: "", duration: "" }] })}>+ Add Education</button>
          </ResumeSection>

          {/* Experience */}
          <ResumeSection
            title="Experience"
            icon={<IconX />}
            isOpen={experienceOpen}
            onToggle={() => setExperienceOpen(!experienceOpen)}
          >
            {resume.experiences.map((exp, i) => (
              <div key={i} className="bg-slate-50 p-3 rounded-md mb-4 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-700">Experience {i + 1}</span>
                  <button className="btn btn-ghost text-red-500 text-xs" onClick={() => setResume({ ...resume, experiences: removeArrayItem(resume.experiences, i) })}>Remove</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="Role" value={exp.role} onChange={(e) => handleExperienceChange(i, { role: e.target.value })} aiContext="Job Role Title" />
                  <FormInput label="Details" value={exp.org} placeholder="Company Name" onChange={(e) => handleExperienceChange(i, { org: e.target.value })} />
                  <FormInput label="Location" value={exp.location} onChange={(e) => handleExperienceChange(i, { location: e.target.value })} />
                  <FormInput label="Duration" value={exp.duration} onChange={(e) => handleExperienceChange(i, { duration: e.target.value })} />
                </div>

                <div className="mt-4">
                  <label className="form-label">Bullets</label>
                  {exp.bullets.map((b, bi) => (
                    <div key={bi} className="flex gap-2 mb-2">
                      <FormInput
                        containerStyle={{ marginBottom: 0, flex: 1 }}
                        value={b}
                        onChange={(e) => {
                          const newBullets = [...exp.bullets];
                          newBullets[bi] = e.target.value;
                          handleExperienceChange(i, { bullets: newBullets });
                        }}
                        aiContext={`Resume bullet point for ${exp.role}`}
                      />
                      <button className="btn btn-ghost text-slate-400" onClick={() => {
                        const newBullets = [...exp.bullets];
                        newBullets.splice(bi, 1);
                        handleExperienceChange(i, { bullets: newBullets });
                      }}>×</button>
                    </div>
                  ))}
                  <button className="btn btn-secondary text-xs" onClick={() => handleExperienceChange(i, { bullets: [...exp.bullets, ""] })}>+ Add Bullet</button>
                </div>
              </div>
            ))}
            <button className="btn btn-secondary w-full" onClick={() => setResume({ ...resume, experiences: [...resume.experiences, { role: "", org: "", location: "", duration: "", bullets: [""] }] })}>+ Add Experience</button>
          </ResumeSection>

          {/* Projects */}
          <ResumeSection
            title="Projects"
            icon={<IconPr />}
            isOpen={projectsOpen}
            onToggle={() => setProjectsOpen(!projectsOpen)}
          >
            {resume.projects.map((proj, i) => (
              <div key={i} className="bg-slate-50 p-3 rounded-md mb-4 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-slate-700">Project {i + 1}</span>
                  <button className="btn btn-ghost text-red-500 text-xs" onClick={() => setResume({ ...resume, projects: removeArrayItem(resume.projects, i) })}>Remove</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="Title" value={proj.title} onChange={(e) => handleProjectChange(i, { title: e.target.value })} />
                  <FormInput label="Date" value={proj.date} onChange={(e) => handleProjectChange(i, { date: e.target.value })} />
                </div>
                <FormInput
                  textarea
                  label="Description/Subtitle"
                  value={proj.subtitle}
                  onChange={(e) => handleProjectChange(i, { subtitle: e.target.value })}
                  aiContext="Project Description"
                />

                <div className="mt-2">
                  <label className="form-label">Bullets</label>
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
                      />
                      <button className="btn btn-ghost text-slate-400" onClick={() => {
                        const newBullets = [...proj.bullets];
                        newBullets.splice(bi, 1);
                        handleProjectChange(i, { bullets: newBullets });
                      }}>×</button>
                    </div>
                  ))}
                  <button className="btn btn-secondary text-xs" onClick={() => handleProjectChange(i, { bullets: [...proj.bullets, ""] })}>+ Add Bullet</button>
                </div>
              </div>
            ))}
            <button className="btn btn-secondary w-full" onClick={() => setResume({ ...resume, projects: [...resume.projects, { title: "", subtitle: "", date: "", bullets: [""], spacing_before: null, spacing_after: null }] })}>+ Add Project</button>
          </ResumeSection>

          {/* Skills */}
          <ResumeSection
            title="Skills & Interests"
            icon={<IconS />}
            isOpen={skillsOpen}
            onToggle={() => setSkillsOpen(!skillsOpen)}
          >
            <div className="grid grid-cols-1 gap-4">
              <FormInput label="Languages" value={resume.skills.languages} onChange={(e) => updateSkills("languages", e.target.value)} />
              <FormInput label="Frameworks" value={resume.skills.frameworks} onChange={(e) => updateSkills("frameworks", e.target.value)} />
              <FormInput label="Web Tools" value={resume.skills.web_tools} onChange={(e) => updateSkills("web_tools", e.target.value)} />
              <FormInput label="Cloud/DB" value={resume.skills.cloud_databases} onChange={(e) => updateSkills("cloud_databases", e.target.value)} />
              <FormInput textarea label="Coursework" value={resume.skills.coursework} onChange={(e) => updateSkills("coursework", e.target.value)} />
              <FormInput textarea label="Soft Skills" value={resume.skills.soft_skills} onChange={(e) => updateSkills("soft_skills", e.target.value)} />
            </div>
          </ResumeSection>

          {/* Layout Settings */}
          <ResumeSection
            title="Layout Settings"
            icon={<IconL />}
            isOpen={layoutOpen}
            onToggle={() => setLayoutOpen(!layoutOpen)}
            description="Fine-tune spacing and margins."
          >
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="Section Spacing Top" value={resume.layout.section_spacing_top} onChange={(e) => updateLayout("section_spacing_top", e.target.value)} />
              <FormInput label="Section Spacing Bottom" value={resume.layout.section_spacing_bottom} onChange={(e) => updateLayout("section_spacing_bottom", e.target.value)} />
              <FormInput label="Section Spacing After" value={resume.layout.section_spacing_after} onChange={(e) => updateLayout("section_spacing_after", e.target.value)} />
              <FormInput label="Bullet Spacing" value={resume.layout.bullet_spacing} onChange={(e) => updateLayout("bullet_spacing", e.target.value)} />
            </div>
          </ResumeSection>

        </div>

        {/* Preview Pane */}
        <div className="preview-pane custom-scrollbar">
          <div className="p-4 border-b border-gray-700 bg-slate-900 sticky top-0">
            <h3 className="text-gray-100 font-semibold m-0 text-sm uppercase tracking-wide">LaTeX Output Preview</h3>
          </div>
          <pre className="p-4 text-xs font-mono text-gray-300 whitespace-pre-wrap break-all">
            {latex || "% Click 'Generate LaTeX' to see the output here."}
          </pre>
        </div>

      </div>

      {/* Global AI Assistant */}
      <AiAssistant onApplyResume={handleFullResumeApply} />
    </div>
  );
};

export default App;
