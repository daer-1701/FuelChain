export type PublicStation = {
  code: string;
  name: string;
  municipality: string | null;
  address: string | null;
  latitude: string | number;
  longitude: string | number;
  availability: 'FULL' | 'MEDIUM' | 'LOW' | 'EMPTY' | 'UNKNOWN';
  products: string[];
  lastInventoryAt: string | null;
  publicLevel: string;
  tankName: string | null;
  fillPercent: number | null;
  waterDetected: boolean;
  temperature: string | number | null;
};
