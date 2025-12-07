export interface Project {
  title: string;
  subtitle: string;
  date: string;
  bullets: string[];
  spacing_before?: string | null;
  spacing_after?: string | null;
}


export interface EducationEntry {
  degree: string;
  grade: string;
  institution: string;
  duration: string;
}

export interface ExperienceEntry {
  role: string;
  org: string;
  location: string;
  duration: string;
  bullets: string[];
}

export interface SkillsAndInterests {
  languages: string;
  libraries: string;
  web_tools: string;
  frameworks: string;
  cloud_databases: string;
  coursework: string;
  areas_of_interest: string;
  soft_skills: string;
}

export interface LayoutSettings {
  section_spacing_top: string;
  section_spacing_bottom: string;
  bullet_spacing: string;
  section_spacing_after: string;   // NEW
}

export interface Resume {
  name: string;
  title: string;
  phone: string;
  email: string;

  summary: string;   // << NEW FIELD

  education: EducationEntry[];
  projects: Project[];
  experiences: ExperienceEntry[];
  skills: SkillsAndInterests;
  layout: LayoutSettings;
}

