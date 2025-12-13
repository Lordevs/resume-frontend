import React from 'react';
import { render, screen, act } from '@testing-library/react';
import App from './App';

// Mock API calls
jest.mock('./api', () => ({
  fetchResume: jest.fn(() => Promise.resolve({
    name: "Test User",
    email: "test@example.com",
    title: "Engineer",
    phone: "123",
    summary: "Summary",
    social_links: [],
    education: [],
    experiences: [],
    projects: [],
    skills: {
      languages: "",
      frameworks: "",
      libraries: "",
      web_tools: "",
      cloud_databases: "",
      coursework: "",
      areas_of_interest: "",
      soft_skills: ""
    },
    layout: {
      section_spacing_top: "2mm",
      section_spacing_bottom: "2mm",
      bullet_spacing: "0mm",
      section_spacing_after: "-5.5mm"
    }
  })),
  saveResume: jest.fn(),
  renderLatex: jest.fn(),
  renderPdf: jest.fn()
}));

jest.mock('./components/AiAssistant', () => () => <div data-testid="ai-assistant">AI Assistant</div>);
jest.mock('./components/AiSuggestButton', () => ({ AiSuggestButton: () => <button>Magic</button> }));

test('renders resume builder header', async () => {
  await act(async () => {
    render(<App />);
  });
  const titleElement = await screen.findByText(/LaTeX Resume Builder/i);
  expect(titleElement).toBeInTheDocument();
});
