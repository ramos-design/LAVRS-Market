
export enum AppStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLIST = 'WAITLIST',
  PAID = 'PAID'
}

export enum SpotSize {
  S = 'S',
  M = 'M',
  L = 'L'
}

export enum ZoneCategory {
  SECONDHANDS = 'Secondhands',
  CESKE_ZNACKY = 'České značky',
  DESIGNERS = 'Designers',
  BEAUTY = 'Beauty ZONE',
  TATTOO = 'TATTOO'
}

// Keep old ZoneType for backward compatibility
export const ZoneType = SpotSize;
export type ZoneType = SpotSize;

export interface MarketEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  status: 'open' | 'closed' | 'waitlist' | 'draft';
  image: string;
  description?: string;
}

export interface Application {
  id: string;
  brandName: string;
  brandDescription: string;
  instagram: string;
  website: string;
  contactPerson: string;
  phone: string;
  email: string;

  // Billing
  billingName: string;
  ic: string;
  dic?: string;
  billingAddress: string;
  billingEmail: string;

  // Configuration
  zone: ZoneType; // Spot size (S/M/L)
  zoneCategory?: ZoneCategory; // Brand category
  status: AppStatus;
  submittedAt: string;
  images: string[];
  eventId: string;

  // Consents
  consentGDPR: boolean;
  consentOrg: boolean;
  consentStorno: boolean;
  consentNewsletter: boolean;

  curatorNote?: string;
  paymentDeadline?: string;
}

export interface Stand {
  id: string;
  x: number; // grid position x
  y: number; // grid position y
  size: SpotSize;
  zoneId: string;
  occupantId?: string; // ID of the application/brand
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  category: ZoneCategory;
  capacities: {
    [key in SpotSize]?: number;
  };
}

export interface ExtraItem {
  id: string;
  label: string;
  price: string;
}

export interface EventPlan {
  eventId: string;
  zones: Zone[];
  stands: Stand[];
  gridSize: { width: number; height: number };
  prices: {
    [key in SpotSize]: string;
  };
  equipment: {
    [key in SpotSize]: string[];
  };
  extras: ExtraItem[];
}

export type ViewMode = 'EXHIBITOR' | 'ADMIN';

export interface User {
  name: string;
  role: ViewMode;
  brand?: string;
}

export interface BrandProfile {
  id: string;
  brandName: string;
  brandDescription?: string;
  instagram?: string;
  website?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  zone?: ZoneType;
  billingName?: string;
  ic?: string;
  dic?: string;
  billingAddress?: string;
  billingEmail?: string;
}
