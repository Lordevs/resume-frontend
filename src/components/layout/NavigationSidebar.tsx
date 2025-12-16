import React from "react";
import {
  User,
  FileText,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Zap,
  LayoutTemplate,
} from "lucide-react";

interface NavigationSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeSection,
  setActiveSection,
}) => {
  const navItems = [
    { id: "personal", label: "Personal Info", icon: <User size={20} /> },
    { id: "summary", label: "Summary", icon: <FileText size={20} /> },
    { id: "education", label: "Education", icon: <GraduationCap size={20} /> },
    {
      id: "experience",
      label: "Work Experience",
      icon: <Briefcase size={20} />,
    },
    { id: "projects", label: "Projects", icon: <FolderGit2 size={20} /> },
    { id: "skills", label: "Skills", icon: <Zap size={20} /> },
    {
      id: "layout",
      label: "Layout Settings",
      icon: <LayoutTemplate size={20} />,
    },
  ];

  return (
    <aside className="nav-sidebar custom-scrollbar">
      <div className="mb-4 px-2">
        <h3 className="text-md font-bold text-black uppercase tracking-wider mb-2">
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
  );
};
