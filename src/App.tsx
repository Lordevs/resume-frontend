import React from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

import AiAssistant from "./components/AiAssistant";
import { useResume } from "./handlers/useResume";
import { Header } from "./components/layout/Header";
import { NavigationSidebar } from "./components/layout/NavigationSidebar";
import { EditorArea } from "./components/layout/EditorArea";

const App: React.FC = () => {
  const {
    resume,
    latex,
    activeSection,
    setActiveSection,
    validation,
    downloading,
    handleSave,
    handleGeneratePreview,
    handleDownloadPdf,
    handleFullResumeApply,
    // Pass everything else to EditorArea
    ...handlers
  } = useResume();

  if (!resume)
    return (
      <div className="flex items-center justify-center h-screen text-slate-500">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          Loading...
        </div>
      </div>
    );

  return (
    <div className="app-container">
      <ToastContainer position="top-right" autoClose={3000} />

      <Header
        onSave={handleSave}
        onPreview={handleGeneratePreview}
        onDownload={handleDownloadPdf}
        isDownloading={downloading}
      />

      <div className="app-main">
        {/* Left Sidebar */}
        <NavigationSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

        {/* Center Editor */}
        <EditorArea
          resume={resume}
          activeSection={activeSection}
          validation={validation}
          {...handlers}
        />

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
