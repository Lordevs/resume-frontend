import React from 'react';
import { render, screen, act } from '@testing-library/react';
import App from './App';
import * as api from './api';

// Mock the API module
jest.mock('./api');
jest.mock('./components/AiAssistant', () => () => <div data-testid="ai-assistant">AI Assistant</div>);
jest.mock('./components/AiSuggestButton', () => ({ AiSuggestButton: () => <button>Magic</button> }));

const mockResume = {
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
};

// Define types for mocks
const mockFetchResume = api.fetchResume as jest.Mock;

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchResume.mockResolvedValue(mockResume);
  });

  test('renders hireonrank header', async () => {
    await act(async () => {
      render(<App />);
    });

    // Check for the new header text
    const titleElement = await screen.findByText(/HireOnRank/i);
    expect(titleElement).toBeInTheDocument();
  });
});
