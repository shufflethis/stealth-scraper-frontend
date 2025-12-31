const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://152.53.160.189:8000';

export interface ScrapeRequest {
  url: string;
  wait_for?: string;
  scroll?: boolean;
  instruction?: string;
  template?: string;
  model?: string;
}

export interface ScrapeResponse {
  success: boolean;
  data?: any;
  error?: string;
  tokens_used?: number;
  model?: string;
  scraped_at?: string;
}

export async function scrape(request: ScrapeRequest): Promise<ScrapeResponse> {
  const response = await fetch(`${API_URL}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Scraping failed');
  }

  return response.json();
}

export async function scrapeAI(url: string, goal: string, model?: string): Promise<ScrapeResponse> {
  const response = await fetch(`${API_URL}/scrape/ai`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, goal, model: model || 'kat-coder-pro' }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'AI Scraping failed');
  }

  return response.json();
}

export async function getModels(): Promise<{ models: string[]; default: string }> {
  const response = await fetch(`${API_URL}/models`);
  return response.json();
}

export async function getTemplates(): Promise<{ templates: string[] }> {
  const response = await fetch(`${API_URL}/templates`);
  return response.json();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
