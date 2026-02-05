
export enum AppStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLIST = 'WAITLIST',
  PAID = 'PAID'
}

export enum ZoneType {
  S = 'S',
  M = 'M',
  L = 'L'
}

export interface MarketEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  status: 'open' | 'closed' | 'waitlist';
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
  zone: ZoneType;
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
