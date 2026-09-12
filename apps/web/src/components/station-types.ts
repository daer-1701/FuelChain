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
  quantityLabel?: string;
  qualityTone?: 'OK' | 'ALERTA' | 'RECHAZADO' | 'SIN_DATO';
  qualityLabel?: string;
  tankName: string | null;
  fillPercent: number | null;
  waterDetected: boolean;
  temperature: string | number | null;
};

export type SupervisionStation = {
  code: string;
  name: string;
  municipality: string | null;
  address: string | null;
  availability: PublicStation['availability'];
  products: string[];
  lastInventoryAt: string | null;
  quantity: {
    stockLiters: number;
    capacityLiters: number;
    fillPercent: number | null;
    publicLevel: string;
  };
  quality: {
    tone: 'OK' | 'ALERTA' | 'RECHAZADO' | 'SIN_DATO';
    label: string;
    summary: string;
    waterDetected: boolean;
    density: number | null;
    temperature: number | null;
    batchCode: string | null;
    batchQualityStatus: string | null;
    certificateStatus: string | null;
  };
  tanks: Array<{
    id: string;
    name: string;
    cisternCode: string | null;
    status: string;
    capacityLiters: number;
    currentStockLiters: number;
    fillPercent: number | null;
    lastMeasurement: {
      volumeLiters: number;
      temperature: number | null;
      density: number | null;
      waterDetected: boolean;
      timestamp: string;
      source: string;
    } | null;
  }>;
  cisterns: Array<{
    tokenId: string;
    cisternCode: string | null;
    eventType: string;
    status: string;
    volumeLiters: number;
    batchCode: string;
    product: string;
    batchQualityStatus: string;
    issuedAt: string;
    consumedAt: string | null;
  }>;
};

export type SupervisionResponse = {
  label: string;
  city: string;
  note: string;
  summary: {
    stations: number;
    lowStock: number;
    qualityAlerts: number;
    fleetCisterns: number;
  };
  data: SupervisionStation[];
  fleetCisterns: Array<{
    cisternCode: string | null;
    name: string;
    status: string;
    capacityLiters: number;
    currentStockLiters: number;
    location: string;
  }>;
};
