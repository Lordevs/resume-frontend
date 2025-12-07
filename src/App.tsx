// src/App.tsx
import React, { useEffect, useState } from "react";
import { Resume, Project, EducationEntry, ExperienceEntry } from "./types";
import { fetchResume, saveResume, renderLatex, renderPdf } from "./api";

function App() {
  const [resume, setResume] = useState<Resume | null>(null);
  const [latex, setLatex] = useState<string>("");

useEffect(() => {
  fetchResume()
    .then((data) => {
      const normalised: Resume = {
        name: data.name || "",
        title: data.title || "",
        phone: data.phone || "",
        email: data.email || "",
        summary: data.summary || "",
        education: data.education || [],          // <= default
        projects: data.projects || [],            // <= make sure exists
        experiences: data.experiences || [],      // <= default
        skills: data.skills || {                  // <= default object
          languages: "",
          libraries: "",
          web_tools: "",
          frameworks: "",
          cloud_databases: "",
          coursework: "",
          areas_of_interest: "",
          soft_skills: "",
        },
        layout: data.layout || {                  // <= default layout
          section_spacing_top: "2mm",
          section_spacing_bottom: "2mm",
          bullet_spacing: "0mm",
          section_spacing_after: "-5.5mm",
        },
      };
      setResume(normalised);
    })
    .catch(console.error);
}, []);
  if (!resume) return <div>Loading...</div>;

  const handleDownloadPdf = async () => {
    if (!resume) return;
    try {
      const blob = await renderPdf(resume);
      const url = URL.createObjectURL(blob);

      // Trigger browser download
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

  const handleFieldChange = (field: keyof Resume, value: any) => {
    setResume({ ...resume, [field]: value });
  };

  const handleProjectChange = (index: number, project: Partial<Project>) => {
    const copy = [...resume.projects];
    copy[index] = { ...copy[index], ...project };
    setResume({ ...resume, projects: copy });
  };

  const handleEducationChange = (index: number, entry: Partial<EducationEntry>) => {
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

const handleExperienceChange = (index: number, entry: Partial<ExperienceEntry>) => {
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

  const handleGenerate = async () => {
    if (!resume) return;
    const tex = await renderLatex(resume);
    setLatex(tex);
  };

  const updateLayout = (field: keyof Resume["layout"], value: string) => {
    setResume({ ...resume, layout: { ...resume.layout, [field]: value } });
  };

  return (
    <div style={{ display: "flex", gap: 16, padding: 16 }}>
      <div style={{ flex: 1, maxWidth: "50%" }}>
        <h2>Personal Info</h2>
        <label>
          Name
          <input
            value={resume.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
          />
        </label>
        <br />
        <label>
          title
          <input
            value={resume.title}
            onChange={(e) => handleFieldChange("title", e.target.value)}
          />
        </label>
        <br />
        <label>
          Phone
          <input
            value={resume.phone}
            onChange={(e) => handleFieldChange("phone", e.target.value)}
          />
        </label>
        <br />
        <label>
          Email
          <input
            value={resume.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
          />
        </label>

        <h2>Layout Settings</h2>
        <label>
          Section spacing top:
          <input
            value={resume.layout.section_spacing_top}
            onChange={(e) =>
              updateLayout("section_spacing_top", e.target.value)
            }
            placeholder="e.g. 2mm"
          />
        </label>
        <br />
        <label>
          Section spacing bottom:
          <input
            value={resume.layout.section_spacing_bottom}
            onChange={(e) =>
              updateLayout("section_spacing_bottom", e.target.value)
            }
            placeholder="e.g. 2mm"
          />
        </label>
        <label>
          Spacing after each section:
          <input
            value={resume.layout.section_spacing_after}
            onChange={(e) =>
              updateLayout("section_spacing_after", e.target.value)
            }
            placeholder="e.g. -5mm, 0mm, 3mm"
          />
        </label>

        <br />
        <label>
          Bullet spacing:
          <input
            value={resume.layout.bullet_spacing}
            onChange={(e) =>
              updateLayout("bullet_spacing", e.target.value)
            }
            placeholder="e.g. 1mm or 0mm"
          />
        </label>

{/* Summary */}

<h2>Summary</h2>
<textarea
  style={{ width: "100%", height: 100, marginBottom: 8 }}
  placeholder="Write 2–4 lines about yourself…"
  value={resume.summary}
  onChange={(e) => setResume({ ...resume, summary: e.target.value })}
/>


{/* Education */}
<h2>Education</h2>
{resume.education.map((e, i) => (
  <div key={i} style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}>
    <input
      style={{ width: "100%", marginBottom: 4 }}
      placeholder="Degree"
      value={e.degree}
      onChange={(ev) => handleEducationChange(i, { degree: ev.target.value })}
    />
    <input
      style={{ width: "100%", marginBottom: 4 }}
      placeholder="Grade (e.g. CGPA: xx)"
      value={e.grade}
      onChange={(ev) => handleEducationChange(i, { grade: ev.target.value })}
    />
    <input
      style={{ width: "100%", marginBottom: 4 }}
      placeholder="Institution"
      value={e.institution}
      onChange={(ev) => handleEducationChange(i, { institution: ev.target.value })}
    />
    <input
      style={{ width: "100%", marginBottom: 4 }}
      placeholder="Duration (e.g. 2020–24)"
      value={e.duration}
      onChange={(ev) => handleEducationChange(i, { duration: ev.target.value })}
    />
  </div>
))}
<button type="button" onClick={addEducation}>
  + Add education entry
</button>

{/* Experience */}
<h2>Experience</h2>
{resume.experiences.map((exp, i) => (
  <div key={i} style={{ border: "1px solid #ccc", padding: 8, marginBottom: 8 }}>
    <input
      style={{ width: "100%", marginBottom: 4 }}
      placeholder="Role"
      value={exp.role}
      onChange={(ev) => handleExperienceChange(i, { role: ev.target.value })}
    />
    <input
      style={{ width: "100%", marginBottom: 4 }}
      placeholder="Organisation"
      value={exp.org}
      onChange={(ev) => handleExperienceChange(i, { org: ev.target.value })}
    />
    <input
      style={{ width: "100%", marginBottom: 4 }}
      placeholder="Location"
      value={exp.location}
      onChange={(ev) => handleExperienceChange(i, { location: ev.target.value })}
    />
    <input
      style={{ width: "100%", marginBottom: 4 }}
      placeholder="Duration"
      value={exp.duration}
      onChange={(ev) => handleExperienceChange(i, { duration: ev.target.value })}
    />

    <h4>Bullets</h4>
    {exp.bullets.map((b, bi) => (
      <input
        key={bi}
        style={{ width: "100%", marginBottom: 4 }}
        value={b}
        onChange={(ev) => {
          const bullets = [...exp.bullets];
          bullets[bi] = ev.target.value;
          handleExperienceChange(i, { bullets });
        }}
      />
    ))}
    <button
      type="button"
      onClick={() => {
        const bullets = [...exp.bullets, ""];
        handleExperienceChange(i, { bullets });
      }}
    >
      + Add bullet
    </button>
  </div>
))}
<button type="button" onClick={addExperience}>
  + Add experience entry
</button>

{/* Skills & Interests */}
<h2>Skills & Interests</h2>
<label>
  Languages
  <input
    style={{ width: "100%", marginBottom: 4 }}
    value={resume.skills.languages}
    onChange={(e) =>
      setResume({ ...resume, skills: { ...resume.skills, languages: e.target.value } })
    }
  />
</label>
<label>
  Libraries
  <input
    style={{ width: "100%", marginBottom: 4 }}
    value={resume.skills.libraries}
    onChange={(e) =>
      setResume({ ...resume, skills: { ...resume.skills, libraries: e.target.value } })
    }
  />
</label>
<label>
  Web Dev Tools
  <input
    style={{ width: "100%", marginBottom: 4 }}
    value={resume.skills.web_tools}
    onChange={(e) =>
      setResume({ ...resume, skills: { ...resume.skills, web_tools: e.target.value } })
    }
  />
</label>
<label>
  Frameworks
  <input
    style={{ width: "100%", marginBottom: 4 }}
    value={resume.skills.frameworks}
    onChange={(e) =>
      setResume({ ...resume, skills: { ...resume.skills, frameworks: e.target.value } })
    }
  />
</label>
<label>
  Cloud / Databases
  <input
    style={{ width: "100%", marginBottom: 4 }}
    value={resume.skills.cloud_databases}
    onChange={(e) =>
      setResume({ ...resume, skills: { ...resume.skills, cloud_databases: e.target.value } })
    }
  />
</label>
<label>
  Relevant Coursework
  <textarea
    style={{ width: "100%", marginBottom: 4 }}
    value={resume.skills.coursework}
    onChange={(e) =>
      setResume({ ...resume, skills: { ...resume.skills, coursework: e.target.value } })
    }
  />
</label>
<label>
  Areas of Interest
  <textarea
    style={{ width: "100%", marginBottom: 4 }}
    value={resume.skills.areas_of_interest}
    onChange={(e) =>
      setResume({ ...resume, skills: { ...resume.skills, areas_of_interest: e.target.value } })
    }
  />
</label>
<label>
  Soft Skills
  <textarea
    style={{ width: "100%", marginBottom: 4 }}
    value={resume.skills.soft_skills}
    onChange={(e) =>
      setResume({ ...resume, skills: { ...resume.skills, soft_skills: e.target.value } })
    }
  />
</label>


        <h2>Projects</h2>
        {resume.projects.map((p, i) => (
          <div
            key={i}
            style={{
              border: "1px solid #ccc",
              padding: 8,
              marginBottom: 8,
              borderRadius: 4,
            }}
          >
            <input
              style={{ width: "100%", marginBottom: 4 }}
              placeholder="Project title"
              value={p.title}
              onChange={(e) =>
                handleProjectChange(i, { title: e.target.value })
              }
            />
            <textarea
              style={{ width: "100%", marginBottom: 4 }}
              placeholder="Subtitle / description"
              value={p.subtitle}
              onChange={(e) =>
                handleProjectChange(i, { subtitle: e.target.value })
              }
            />
            <input
              style={{ width: "100%", marginBottom: 4 }}
              placeholder="Date"
              value={p.date}
              onChange={(e) =>
                handleProjectChange(i, { date: e.target.value })
              }
            />
            <label>
              Spacing before:
              <input
                value={p.spacing_before || ""}
                onChange={(e) =>
                  handleProjectChange(i, {
                    spacing_before: e.target.value || null,
                  })
                }
                placeholder="e.g. 2mm"
              />
            </label>
            <br />
            <label>
              Spacing after:
              <input
                value={p.spacing_after || ""}
                onChange={(e) =>
                  handleProjectChange(i, {
                    spacing_after: e.target.value || null,
                  })
                }
                placeholder="e.g. 2mm"
              />
            </label>

            <h4>Bullets</h4>
            {p.bullets.map((b, bi) => (
              <div key={bi}>
                <input
                  style={{ width: "100%", marginBottom: 4 }}
                  value={b}
                  onChange={(e) => {
                    const bullets = [...p.bullets];
                    bullets[bi] = e.target.value;
                    handleProjectChange(i, { bullets });
                  }}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const bullets = [...p.bullets, ""];
                handleProjectChange(i, { bullets });
              }}
            >
              + Add bullet
            </button>
          </div>
        ))}
        
        <button type="button" onClick={addProject}>
          + Add project
        </button>

        <div style={{ marginTop: 16 }}>
          <button
            type="button"
            onClick={async () => await saveResume(resume)}
          >
            Save resume JSON
          </button>
          <button
            type="button"
            style={{ marginLeft: 8 }}
            onClick={handleGenerate}
          >
            Generate LaTeX
          </button>


          <div style={{ display: "flex", gap: 16, padding: 16 }}>
            {/* left pane with form ... */}

            <div style={{ marginTop: 16 }}>
              <button
                type="button"
                onClick={async () => resume && (await saveResume(resume))}
              >
                Save resume JSON
              </button>
              <button
                type="button"
                style={{ marginLeft: 8 }}
                onClick={async () => {
                  if (!resume) return;
                  const tex = await renderLatex(resume);
                  setLatex(tex);
                }}
              >
                Generate LaTeX
              </button>
              <button
                type="button"
                style={{ marginLeft: 8 }}
                onClick={handleDownloadPdf}
              >
                Download PDF
              </button>
            </div>

            {/* right pane with LaTeX preview ... */}
          </div>
        

        </div>
      </div>

      

      <div style={{ flex: 1 }}>
        <h2>LaTeX Output</h2>
        <pre
          style={{
            maxHeight: "80vh",
            overflow: "auto",
            background: "#111",
            color: "#0f0",
            padding: 8,
            fontSize: 12,
          }}
        >
          {latex}
        </pre>
      </div>
    </div>
  );
}

export default App;
