import React, { useState, useRef } from "react";
import { generateContent } from "../api/gemini";
import { Resume } from "../types";
import { toast } from "react-toastify";
import {
  Sparkles,
  X,
  Copy,
  Paperclip,
  PenTool,
  Zap,
  Search,
  Wand2,
  Loader2,
} from "lucide-react";

interface AiAssistantProps {
  onApplyResume?: (resume: Resume) => void;
  trigger?: (props: { onClick: () => void }) => React.ReactNode;
}

export default function AiAssistant({
  onApplyResume,
  trigger,
}: AiAssistantProps) {
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

  // Schema for full resume generation
  const RESUME_SCHEMA = {
    name: "string",
    email: "string",
    title: "string",
    phone: "string",
    summary: "string",
    social_links: [{ name: "string", url: "string" }],
    education: [
      {
        degree: "string",
        grade: "string",
        institution: "string",
        duration: "string",
      },
    ],
    experiences: [
      {
        role: "string",
        org: "string",
        location: "string",
        duration: "string",
        bullets: ["string"],
      },
    ],
    projects: [
      {
        title: "string",
        subtitle: "string",
        date: "string",
        bullets: ["string"],
      },
    ],
    skills: {
      languages: "string",
      frameworks: "string",
      libraries: "string",
      web_tools: "string",
      cloud_databases: "string",
      coursework: "string",
      areas_of_interest: "string",
      soft_skills: "string",
    },
  };

  const handleGenerate = async (isFullResume: boolean = false) => {
    if (!prompt.trim() && !file) {
      if (isFullResume && !file && !prompt.trim()) {
        toast.info(
          "Please upload a resume or provide some details (like a LinkedIn bio) to generate a full resume."
        );
        return;
      }
      if (!isFullResume) return;
    }

    setLoading(true);
    setResult(""); // Clear previous

    try {
      let finalSystemInstruction = SYSTEM_INSTRUCTION;
      let userPrompt = prompt;

      if (isFullResume) {
        finalSystemInstruction = `You are a Resume Parser & Generator. 
        Your task is to extract information from the user's input (Bio, Existing Resume PDF/Image) and structure it into a VALID JSON object.
        
        Strictly follow this JSON schema:
        ${JSON.stringify(RESUME_SCHEMA, null, 2)}
        
        Rules:
        1. OUTPUT ONLY RAW JSON. No markdown backticks, no explanations.
        2. If information is missing, use empty strings "" or empty arrays [].
        3. Make the content professional and concise.
        `;

        if (!userPrompt)
          userPrompt = "Generate a professional resume from the attached file.";
      }

      const text = await generateContent({
        prompt: userPrompt,
        file,
        systemInstruction: finalSystemInstruction,
      });

      if (isFullResume && onApplyResume) {
        try {
          // strip backticks if gemini adds them despite instructions
          const cleaned = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
          const json = JSON.parse(cleaned);

          // Basic validation
          if (json && typeof json === "object") {
            onApplyResume(json as Resume);
            setResult(
              "Resume successfully generated and applied! Close this window to verify."
            );
            setIsOpen(false);
          } else {
            setResult("AI generated invalid JSON. Please try again.");
          }
        } catch (e) {
          console.error("JSON Parse Error", e);
          setResult(
            `Failed to parse AI response into Resume format.\nRaw output:\n${text}`
          );
        }
      } else {
        setResult(text || "No response generated.");
      }
    } catch (err) {
      setResult("Error connecting to Gemini. Please check your API key.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard!");
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
      {/* Floating Action Button or Custom Trigger */}
      {trigger ? (
        trigger({ onClick: () => setIsOpen(true) })
      ) : (
        <button
          className="ai-fab"
          onClick={() => setIsOpen(true)}
          title="Open AI Assistant">
          <Sparkles size={20} />
        </button>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div className="ai-overlay" onClick={() => setIsOpen(false)} />
      )}

      {/* Drawer */}
      {isOpen && (
        <div className="ai-dialog">
          {/* Header */}
          <div className="ai-header">
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#0f172a",
                }}>
                AI Assistant
              </h2>
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                Powered by{" "}
                <span style={{ fontWeight: 600, color: "#2563eb" }}>
                  Gemini 2.5 Flash
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#94a3b8",
              }}>
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="ai-content">
            {/* Main Action for Full Resume */}
            {onApplyResume && (
              <div style={{ marginBottom: 10 }}>
                <button
                  className="ai-btn-special"
                  onClick={() => handleGenerate(true)}
                  disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />{" "}
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} /> Generate Full Resume from Context
                    </>
                  )}
                </button>
                <p
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    textAlign: "center",
                    marginTop: 6,
                  }}>
                  Upload a PDF or paste your bio below first!
                </p>
              </div>
            )}

            <hr
              style={{
                border: "none",
                borderTop: "1px solid #f1f5f9",
                margin: "0 0 10px 0",
              }}
            />

            {/* Presets */}
            <div className="ai-chip-container">
              <button
                className="ai-chip flex flex-row items-center gap-2"
                onClick={() =>
                  applyPreset(
                    "Write a professional summary for a software engineer with 3 years experience in React and Node.js."
                  )
                }>
                <PenTool size={14} /> Write Summary
              </button>
              <button
                className="ai-chip flex flex-row items-center gap-2"
                onClick={() =>
                  applyPreset(
                    "Rewrite these bullet points to be more impactful using STAR method:\n- "
                  )
                }>
                <Zap size={14} /> Enhance Bullets
              </button>
              <button
                className="ai-chip flex flex-row items-center gap-2"
                onClick={() =>
                  applyPreset(
                    "Analyze the attached resume against a job description I will paste below."
                  )
                }>
                <Search size={14} /> Review Resume
              </button>
            </div>

            {/* Text Input */}
            <textarea
              className="ai-textarea"
              placeholder="Describe what you need (e.g., 'Rewrite my work experience at Google...')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />

            {/* File Upload */}
            <div
              className="ai-file-upload"
              onClick={() => fileInputRef.current?.click()}>
              <Paperclip size={16} />
              <span>
                {file
                  ? file.name
                  : "Attach context (Resume PDF, Job Desc Image)"}
              </span>
              {file && (
                <span
                  className="ai-file-upload-clear"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}>
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

            {/* Regular Generate Button */}
            <button
              className="ai-btn-primary"
              style={{ opacity: loading ? 0.7 : 1 }}
              onClick={() => handleGenerate(false)}
              disabled={loading}>
              {loading ? (
                "Thinking..."
              ) : (
                <>
                  Ask Assistant <Sparkles size={20} />
                </>
              )}
            </button>

            {/* Result Area */}
            {result && (
              <div className="ai-response-box">
                <div className="ai-response-header">
                  <span>AI Suggestion</span>
                  <button
                    onClick={copyToClipboard}
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#2563eb",
                      display: "flex",
                      gap: 4,
                      alignItems: "center",
                      fontSize: 12,
                      fontWeight: 600,
                    }}>
                    <Copy size={14} /> Copy
                  </button>
                </div>
                <div className="ai-response-body">{result}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
