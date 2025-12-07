// src/components/AiAssistant.tsx
import React, { useState, useRef } from "react";
import { generateContent } from "../api/gemini";

/* --- Icons --- */
const SparklesIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
);
const XIcon = () => (
  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);
const CopyIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
);
const PaperClipIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
);

/* --- Styles (Inline for portability) --- */
const styles = {
  fab: {
    position: "fixed" as const,
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "#0f172a", // Slate-900
    color: "white",
    border: "none",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    transition: "transform 0.2s ease",
  },
  overlay: {
    position: "fixed" as const,
    inset: 0,
    background: "rgba(0,0,0,0.3)",
    backdropFilter: "blur(4px)",
    zIndex: 99,
  },
  drawer: {
    position: "fixed" as const,
    top: 0,
    right: 0,
    height: "100%",
    width: 400,
    maxWidth: "90vw",
    background: "white",
    boxShadow: "-10px 0 25px rgba(0,0,0,0.1)",
    zIndex: 100,
    display: "flex",
    flexDirection: "column" as const,
    transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    borderLeft: "1px solid #e2e8f0",
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid #f1f5f9",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: "24px",
    overflowY: "auto" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: 20,
  },
  chipContainer: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 8,
  },
  chip: {
    fontSize: 12,
    fontWeight: 500,
    padding: "6px 12px",
    borderRadius: 999,
    border: "1px solid #e2e8f0",
    background: "white",
    color: "#475569",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  textarea: {
    width: "100%",
    minHeight: 120,
    padding: 12,
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical" as const,
    outline: "none",
    boxSizing: "border-box" as const,
  },
  fileUpload: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px dashed #cbd5e1",
    color: "#64748b",
    fontSize: 13,
    cursor: "pointer",
    background: "#f8fafc",
    transition: "background 0.2s",
  },
  btnPrimary: {
    width: "100%",
    padding: "12px",
    borderRadius: 8,
    background: "#0f172a",
    color: "white",
    fontWeight: 600,
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 14,
  },
  responseBox: {
    background: "#f8fafc",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  responseHeader: {
    padding: "8px 12px",
    background: "#f1f5f9",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 12,
    color: "#64748b",
    fontWeight: 600,
  },
  responseBody: {
    padding: 12,
    fontSize: 14,
    lineHeight: 1.6,
    color: "#334155",
    whiteSpace: "pre-wrap" as const,
  },
};

/* --- Main Component --- */

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // System instructions for the Resume Expert persona
  const SYSTEM_INSTRUCTION = `You are an expert Resume Writer and Career Coach. 
  Your goal is to help the user write high-impact resume content.
  
  Guidelines:
  1. Use the STAR method (Situation, Task, Action, Result) for bullet points.
  2. Use strong action verbs (e.g., Engineered, Spearheaded, Optimized).
  3. Be concise but descriptive. Remove fluff.
  4. If the user provides a job description (via image/text), tailor the resume content to match it.
  5. Output ONLY the requested content (no conversational filler like "Here is your summary:").
  `;

  const handleGenerate = async () => {
    if (!prompt.trim() && !file) return;

    setLoading(true);
    setResult(""); // Clear previous

    try {
      const text = await generateContent({
        prompt,
        file,
        systemInstruction: SYSTEM_INSTRUCTION,
      });
      setResult(text || "No response generated.");
    } catch (err) {
      setResult("Error connecting to Gemini. Please check your API key.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    alert("Copied to clipboard!"); // Replace with a toast if you have one
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const applyPreset = (text: string) => {
    setPrompt(text);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        style={styles.fab} 
        onClick={() => setIsOpen(true)}
        title="Open AI Assistant"
      >
        <SparklesIcon />
      </button>

      {/* Backdrop */}
      {isOpen && <div style={styles.overlay} onClick={() => setIsOpen(false)} />}

      {/* Drawer */}
      <div style={{ ...styles.drawer, transform: isOpen ? "translateX(0)" : "translateX(100%)" }}>
        
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#0f172a" }}>AI Assistant</h2>
            <div style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 6 }}>
              Powered by <span style={{ fontWeight: 600, color: "#2563eb" }}>Gemini 2.5 Flash</span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8" }}
          >
            <XIcon />
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          
          {/* Presets */}
          <div style={styles.chipContainer}>
            <button 
              style={styles.chip}
              onClick={() => applyPreset("Write a professional summary for a software engineer with 3 years experience in React and Node.js.")}
            >
              ✍️ Write Summary
            </button>
            <button 
              style={styles.chip}
              onClick={() => applyPreset("Rewrite these bullet points to be more impactful using STAR method:\n- ")}
            >
              🚀 Enhance Bullets
            </button>
            <button 
              style={styles.chip}
              onClick={() => applyPreset("Analyze the attached resume against a job description I will paste below.")}
            >
              🔍 Review Resume
            </button>
          </div>

          {/* Text Input */}
          <textarea
            style={styles.textarea}
            placeholder="Describe what you need (e.g., 'Rewrite my work experience at Google to sound more managerial')"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />

          {/* File Upload */}
          <div style={styles.fileUpload} onClick={() => fileInputRef.current?.click()}>
            <PaperClipIcon />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {file ? file.name : "Attach context (Resume PDF, Job Desc Image)"}
            </span>
            {file && (
              <span 
                style={{ color: "#ef4444", fontWeight: "bold", padding: "0 8px" }}
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
              >
                ✕
              </span>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            hidden 
            accept="image/*,application/pdf"
            onChange={onFileSelect} 
          />

          {/* Generate Button */}
          <button 
            style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }} 
            onClick={handleGenerate} 
            disabled={loading}
          >
            {loading ? "Thinking..." : (
              <>Generate <SparklesIcon /></>
            )}
          </button>

          {/* Result Area */}
          {result && (
            <div style={styles.responseBox}>
              <div style={styles.responseHeader}>
                <span>AI Suggestion</span>
                <button 
                  onClick={copyToClipboard}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#2563eb", display: "flex", gap: 4, alignItems: "center", fontSize: 12, fontWeight: 600 }}
                >
                  <CopyIcon /> Copy
                </button>
              </div>
              <div style={styles.responseBody}>
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}