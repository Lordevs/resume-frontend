// src/api/gemini.ts
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("Missing REACT_APP_GEMINI_API_KEY in .env file");
}

// Initialize client (pass empty string fallback to satisfy TypeScript if key is missing)
const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

/**
 * Helper: Convert Browser File to Base64 for Inline Data
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove "data:image/png;base64," prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = (err) => reject(err);
  });
};

export type GenerateOptions = {
  prompt: string;
  file?: File | null;
  systemInstruction?: string;
};

/**
 * Generate content using Gemini 2.5 Flash
 */
export const generateContent = async ({
  prompt,
  file,
  systemInstruction,
}: GenerateOptions): Promise<string> => {
  try {
    const contentParts: any[] = [{ text: prompt }];

    // Handle Multimodal Input
    if (file) {
      const base64Data = await fileToBase64(file);
      contentParts.push({
        inlineData: {
          mimeType: file.type,
          data: base64Data,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
      contents: [
        {
          role: "user",
          parts: contentParts,
        },
      ],
    });

    /* * FIX 2 & 3: Handle response.text
     * In the new SDK, 'text' is a getter property, NOT a function.
     * We also verify response exists to satisfy TS.
     */
    if (!response || !response.text) {
      throw new Error("No response received from Gemini.");
    }
    
    // Access property directly (no parentheses)
    return response.text; 

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error: Unable to generate content. Please check your API key and connection.";
  }
};