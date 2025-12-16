import React from "react";

interface HeaderProps {
  onDownload: () => void;
  isDownloading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onDownload,
  isDownloading,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-10">
      <div className="flex items-center gap-3">
        <div>
          <div className="w-full h-full">
            <img src="logo.svg" alt="Logo" className="w-[180px] h-auto" />
          </div>
        </div>
      </div>
      <div className="flex justify-center items-center gap-3">
        {/* <button className="btn btn-secondary text-sm" onClick={onSave}>
          Save Progress
        </button>
        <button className="btn btn-secondary text-sm" onClick={onPreview}>
          LaTeX Preview
        </button> */}
        <button
          className="btn btn-primary text-sm shadow-indigo-200 shadow-md"
          disabled={isDownloading}
          style={{ opacity: isDownloading ? 0.7 : 1 }}
          onClick={onDownload}>
          {isDownloading ? "Generating..." : "Download PDF"}
        </button>
      </div>
    </header>
  );
};
