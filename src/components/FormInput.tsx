import React from "react";
import { AiSuggestButton } from "./AiSuggestButton";

interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  textarea?: boolean;
  aiContext?: string; // If present, shows the sparkle button
  containerStyle?: React.CSSProperties;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  textarea,
  aiContext,
  containerStyle,
  className,
  value,
  onChange,
  ...props
}) => {
  const handleAiSuggestion = (text: string) => {
    // Construct a synthetic event to update parent state
    const event = {
      target: { value: text },
    } as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;

    if (onChange) {
      onChange(event);
    }
  };

  return (
    <div className="form-field" style={containerStyle}>
      {label && <label className="form-label">{label}</label>}

      <div className="input-wrapper">
        {textarea ? (
          <textarea
            className={`form-textarea ${className || ""}`}
            value={value}
            onChange={onChange}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            className={`form-input ${className || ""}`}
            value={value}
            onChange={onChange}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}

        {aiContext && (
          <AiSuggestButton
            context={aiContext}
            onSuggestion={handleAiSuggestion}
            currentValue={String(value || "")}
          />
        )}
      </div>
    </div>
  );
};
