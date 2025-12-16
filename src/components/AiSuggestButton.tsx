import React, { useState } from "react";
import { generateContent } from "../api/gemini";
import { Sparkles, Loader2 } from "lucide-react";

interface AiSuggestButtonProps {
  context: string;
  onSuggestion: (text: string) => void;
  currentValue?: string;
  style?: React.CSSProperties;
}

export const AiSuggestButton: React.FC<AiSuggestButtonProps> = ({
  context,
  onSuggestion,
  currentValue,
  style,
}) => {
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
      className="magic-btn-absolute flex items-center justify-center transition-colors hover:brightness-110"
      onClick={handleMagicClick}
      disabled={loading}
      title="Improve with AI"
      style={{
        ...style,
        background: "var(--primary)",
        color: "white",
        borderRadius: "50%",
        width: "24px",
        height: "24px",
        padding: "4px",
        border: "none",
        cursor: loading ? "wait" : "pointer",
      }}>
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Sparkles size={14} />
      )}
    </button>
  );
};
