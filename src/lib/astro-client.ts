/**
 * Type-safe HTTP client for astro-engine (FastAPI microservice)
 */

const ASTRO_ENGINE_URL = process.env.ASTRO_ENGINE_URL || "http://localhost:8000";

export interface BirthData {
  name?: string;
  birth_date: string; // YYYY-MM-DD
  birth_time: string; // HH:MM:SS
  latitude: number;
  longitude: number;
  timezone: string;
  ayanamsha?: string; // lahiri (default), raman, krishnamurti
}

export interface Planet {
  sign: string;
  sign_num: number;
  degrees: number;
  house: number;
  nakshatra: string;
  pada: number;
  retrograde: boolean;
  combust: boolean;
  lord: string;
}

export interface House {
  sign: string;
  lord: string;
  planets: string[];
}

export interface DashaBalance {
  planet: string;
  years: number;
  months: number;
  days: number;
}

export interface DashaPeriod {
  planet: string;
  start: string;
  end: string;
}

export interface CurrentDasha {
  mahadasha: string;
  antardasha: string;
  mahadasha_start: string;
  mahadasha_end: string;
  antardasha_start: string;
  antardasha_end: string;
}

export interface Yoga {
  name: string;
  type: string;
  strength: string;
  description: string;
  planets: string[];
  effect: string;
}

export interface ChartData {
  calculated_at: string;
  ayanamsha: string;
  ayanamsha_value: number;
  julian_day: number;
  lagna: {
    sign: string;
    sign_num: number;
    degrees: number;
    lord: string;
  };
  planets: Record<string, Planet>;
  houses: Record<string, House>;
  dashas: {
    balance_at_birth: DashaBalance;
    sequence: DashaPeriod[];
    current: CurrentDasha;
  };
  yogas: Yoga[];
  ashtakavarga?: Record<string, number[]>;
  numerology?: {
    birth_number: number;
    name_number: number;
    destiny_number: number;
  };
}

export interface TransitData {
  date: string;
  planets: Record<string, Omit<Planet, "house">>;
}

export interface AspectData {
  transiting_planet: string;
  natal_planet: string;
  aspect_type: string;
  orb: number;
  applying: boolean;
}

/**
 * Calculate full birth chart
 */
export async function calculateChart(birthData: BirthData): Promise<ChartData> {
  const response = await fetch(`${ASTRO_ENGINE_URL}/chart`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(birthData),
  });

  if (!response.ok) {
    throw new Error(`Chart calculation failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get current planetary positions (transits)
 */
export async function getCurrentTransits(): Promise<TransitData> {
  const response = await fetch(`${ASTRO_ENGINE_URL}/chart/transits`);

  if (!response.ok) {
    throw new Error(`Transit fetch failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get transits vs natal chart (aspects)
 */
export async function getTransitsVsNatal(
  natalChart: ChartData,
  currentTransits: TransitData
): Promise<AspectData[]> {
  const response = await fetch(`${ASTRO_ENGINE_URL}/chart/transits/natal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ natal: natalChart, transits: currentTransits }),
  });

  if (!response.ok) {
    throw new Error(`Transit aspect calculation failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Generate PDF for a report
 */
export async function generatePDF(
  reportId: string,
  content: string,
  reportType: string
): Promise<Buffer> {
  const response = await fetch(`${ASTRO_ENGINE_URL}/pdf/report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report_id: reportId, content, report_type: reportType }),
  });

  if (!response.ok) {
    throw new Error(`PDF generation failed: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
