import React, { useState } from "react";
import { generateContent } from "../api/gemini";

interface AiSuggestButtonProps {
  context: string;
  onSuggestion: (text: string) => void;
  currentValue?: string;
  style?: React.CSSProperties;
}

const SparklesIcon = () => (
  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ animation: "spin 1s linear infinite" }}>
    <circle cx="12" cy="12" r="10" strokeWidth="4" strokeOpacity="0.3"></circle>
    <path strokeWidth="4" d="M4 12a8 8 0 018-8v8H4z"></path>
    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
  </svg>
);

export const AiSuggestButton: React.FC<AiSuggestButtonProps> = ({ context, onSuggestion, currentValue, style }) => {
  const [loading, setLoading] = useState(false);

  const handleMagicClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);

    const prompt = `Act as a professional resume writer. 
    Context: Writing content for the "${context}" field of a resume.
    Current value: "${currentValue || ""}"
    Goal: Make it more professional, impactful, and concise. Use action verbs.
    Output: ONLY the improved text, no explanations.`;

    try {
      const text = await generateContent({ prompt });
      if (text) {
        onSuggestion(text.trim());
      }
    } catch (err) {
      console.error("AI Suggestion failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="magic-btn-absolute"
      onClick={handleMagicClick}
      disabled={loading}
      title="Improve with AI"
      style={style}
    >
      {loading ? <SpinnerIcon /> : <SparklesIcon />}
    </button>
  );
};
