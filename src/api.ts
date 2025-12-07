// src/api.ts
import { Resume } from "./types";

const BASE_URL = "http://localhost:5000";

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
