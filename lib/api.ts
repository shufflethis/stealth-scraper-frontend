// Runtime API URL - not build time
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return 'https://api.texttoaction.de';
  }
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.texttoaction.de';
};
const API_URL = 'https://api.texttoaction.de';

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

// Flight Search APIs
export interface FlightResult {
  price: number;
  currency: string;
  airline?: string;
  stops?: number;
  departure_at?: string;
  duration?: string;
  link?: string;
}

export interface FlightSearchResponse {
  success: boolean;
  origin: string;
  destination: string;
  date?: string;
  lowest_price?: number;
  flights?: FlightResult[];
  error?: string;
}

export async function searchFlights(
  origin: string,
  destination: string,
  date?: string
): Promise<FlightSearchResponse> {
  const url = date
    ? `${API_URL}/travelpayouts/prices/${origin}/${destination}?date=${date}`
    : `${API_URL}/travelpayouts/prices/${origin}/${destination}`;

  const response = await fetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Flight search failed');
  }

  return response.json();
}

export async function searchFlightsAmadeus(
  origin: string,
  destination: string,
  date: string
): Promise<any> {
  const response = await fetch(`${API_URL}/amadeus/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin,
      destination,
      departure_date: date,
      adults: 1,
      max_results: 10
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Amadeus search failed');
  }

  return response.json();
}

export function generateBookingLink(origin: string, destination: string, date: string): string {
  // Format: DDMM
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `https://www.aviasales.com/search/${origin}${day}${month}${destination}1?marker=485199`;
}

export function generateSkyscannerLink(origin: string, destination: string, date: string): string {
  // Format: YYMMDD
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `https://www.skyscanner.de/transport/fluge/${origin.toLowerCase()}/${destination.toLowerCase()}/${yy}${mm}${dd}/?adultsv2=1&cabinclass=economy&rtn=0`;
}
