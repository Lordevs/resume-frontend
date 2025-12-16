import React, { ReactNode } from "react";

interface ResumeSectionProps {
  title: string;
  description?: string;
  icon: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  badge?: string;
  children: ReactNode;
  rightElement?: ReactNode;
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="20"
    height="20"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
    style={{
      transform: open ? "rotate(180deg)" : "rotate(0deg)", // Fixed rotation logic
      transition: "transform 0.2s ease",
      color: "#94a3b8",
    }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export const ResumeSection: React.FC<ResumeSectionProps> = ({
  title,
  description,
  icon,
  isOpen,
  onToggle,
  badge,
  children,
  rightElement,
}) => {
  return (
    <div className="section-card">
      <div className="section-header" onClick={onToggle}>
        <div className="flex items-center gap-4">
          {icon}
          <div>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-bold"
                style={{ color: "var(--text-main)" }}>
                {title}
              </span>
              {badge && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 999,
                    background: "#fee2e2",
                    color: "#b91c1c",
                    textTransform: "uppercase",
                  }}>
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {description}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {rightElement}
          <ChevronIcon open={isOpen} />
        </div>
      </div>

      {isOpen && <div className="section-body">{children}</div>}
    </div>
  );
};
