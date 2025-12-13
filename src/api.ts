// src/api.ts
import { Resume } from "./types";

const BASE_URL = "https://api.resume.hireonrank.com";

export async function fetchResume(): Promise<Resume> {
  const res = await fetch(`${BASE_URL}/resume`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function saveResume(resume: Resume): Promise<void> {
  const res = await fetch(`${BASE_URL}/resume`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resume),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function renderLatex(resume: Resume): Promise<string> {
  const res = await fetch(`${BASE_URL}/render-latex`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resume),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.latex;
}



export async function renderPdf(resume: Resume): Promise<Blob> {
  const res = await fetch(`${BASE_URL}/render-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resume),
  });
  if (!res.ok) {
    // Try to read JSON error from server for debugging
    const text = await res.text();
    throw new Error(`PDF HTTP ${res.status}: ${text}`);
  }
  return res.blob(); // application/pdf
}