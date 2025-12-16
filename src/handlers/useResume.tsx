import { useState, useEffect } from "react";
import {
  Resume,
  Project,
  EducationEntry,
  ExperienceEntry,
  SocialLink,
} from "../types";
import { fetchResume, saveResume, renderLatex, renderPdf } from "../api";
import { toast } from "react-toastify";

export interface ValidationResult {
  ok: boolean;
  messages: string[];
  errorsBySection: Record<string, string[]>;
}

export const useResume = () => {
  const [resume, setResume] = useState<Resume | null>(null);
  const [latex, setLatex] = useState<string>("");
  const [activeSection, setActiveSection] = useState<string>("personal");
  const [validation, setValidation] = useState<ValidationResult>({
    ok: true,
    messages: [],
    errorsBySection: {},
  });
  const [downloading, setDownloading] = useState(false);

  // Helper Functions

  const validateResume = (resume: Resume): ValidationResult => {
    const errorsBySection: Record<string, string[]> = {};
    const addError = (section: string, msg: string) => {
      if (!errorsBySection[section]) errorsBySection[section] = [];
      errorsBySection[section].push(msg);
    };

    if (!resume.name.trim()) addError("personal", "Name is required.");
    if (!resume.email.trim()) addError("personal", "Email is required.");
    if (!resume.summary.trim()) addError("summary", "Summary is required.");
    if (resume.education.length === 0)
      addError("education", "At least one education entry is required.");
    if (resume.education.some((e) => !e.institution.trim()))
      addError("education", "All education entries need an institution.");

    const allMessages = Object.values(errorsBySection).flat();

    return {
      ok: allMessages.length === 0,
      messages: allMessages,
      errorsBySection,
    };
  };

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

  useEffect(() => {
    if (resume) {
      setValidation(validateResume(resume));
    }
  }, [resume]);

  const updateResumeField = (field: keyof Resume, value: any) => {
    if (resume) setResume({ ...resume, [field]: value });
  };

  const updateSkills = (field: keyof Resume["skills"], value: string) => {
    if (resume)
      setResume({ ...resume, skills: { ...resume.skills, [field]: value } });
  };

  const updateLayout = (field: keyof Resume["layout"], value: string) => {
    if (resume)
      setResume({ ...resume, layout: { ...resume.layout, [field]: value } });
  };

  const handleSocialChange = (index: number, partial: Partial<SocialLink>) => {
    if (resume) {
      const links = [...resume.social_links];
      links[index] = { ...links[index], ...partial };
      setResume({ ...resume, social_links: links });
    }
  };

  const addSocialLink = () => {
    if (resume) {
      if (resume.social_links.length >= 4) {
        toast.warning("Max 4 links allowed.");
        return;
      }
      setResume({
        ...resume,
        social_links: [...resume.social_links, { name: "", url: "" }],
      });
    }
  };

  const removeSocialLink = (index: number) => {
    if (resume) {
      setResume({
        ...resume,
        social_links: resume.social_links.filter((_, i) => i !== index),
      });
    }
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
    if (resume) {
      setResume({
        ...resume,
        education: updateArrayItem(resume.education, index, entry),
      });
    }
  };

  const handleExperienceChange = (
    index: number,
    entry: Partial<ExperienceEntry>
  ) => {
    if (resume) {
      setResume({
        ...resume,
        experiences: updateArrayItem(resume.experiences, index, entry),
      });
    }
  };

  const handleProjectChange = (index: number, entry: Partial<Project>) => {
    if (resume) {
      setResume({
        ...resume,
        projects: updateArrayItem(resume.projects, index, entry),
      });
    }
  };

  const handleSave = async () => {
    if (resume) await saveResume(resume);
  };

  const handleFullResumeApply = (newResume: Resume) => {
    if (!resume) {
      setResume(newResume);
      return;
    }
    // Merge with default layout to ensure consistency if AI misses it
    const merged = {
      ...resume,
      ...newResume,
      layout: { ...resume.layout, ...(newResume.layout || {}) },
    };
    setResume(merged);
  };

  const handleGeneratePreview = () => {
    if (resume) {
      renderLatex(resume).then(setLatex).catch(console.error);
    }
  };

  const handleDownloadPdf = async () => {
    if (!validation.ok) {
      toast.error("Fixed validation issues first.");
      return;
    }
    setDownloading(true);
    try {
      if (resume) {
        // NOTE: User requested applying this logic which omits sanitizeResume
        const blob = await renderPdf(resume);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${resume.name.replace(/\s+/g, "_")}_Resume.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (err: any) {
      console.error("PDF error", err);
      toast.error("Failed to generate PDF.");
    } finally {
      setDownloading(false);
    }
  };

  // Expose removeArrayItem for use in components if needed, or wrap it in specific handlers
  const removeEducation = (index: number) => {
    if (resume)
      setResume({
        ...resume,
        education: removeArrayItem(resume.education, index),
      });
  };
  const removeExperience = (index: number) => {
    if (resume)
      setResume({
        ...resume,
        experiences: removeArrayItem(resume.experiences, index),
      });
  };
  const removeProject = (index: number) => {
    if (resume)
      setResume({
        ...resume,
        projects: removeArrayItem(resume.projects, index),
      });
  };
  const addEducation = () => {
    if (resume)
      setResume({
        ...resume,
        education: [
          ...resume.education,
          { degree: "", grade: "", institution: "", duration: "" },
        ],
      });
  };
  const addExperience = () => {
    if (resume)
      setResume({
        ...resume,
        experiences: [
          ...resume.experiences,
          { role: "", org: "", location: "", duration: "", bullets: [""] },
        ],
      });
  };
  const addProject = () => {
    if (resume)
      setResume({
        ...resume,
        projects: [
          ...resume.projects,
          { title: "", subtitle: "", date: "", bullets: [""] },
        ],
      });
  };

  return {
    resume,
    setResume, // Exposed if needed, but handlers usually sufficient
    latex,
    activeSection,
    setActiveSection,
    validation,
    downloading,
    updateResumeField,
    updateSkills,
    updateLayout,
    handleSocialChange,
    addSocialLink,
    removeSocialLink,
    handleEducationChange,
    handleExperienceChange,
    handleProjectChange,
    handleSave,
    handleFullResumeApply,
    handleGeneratePreview,
    handleDownloadPdf,
    removeEducation,
    removeExperience,
    removeProject,
    addEducation,
    addExperience,
    addProject,
  };
};
