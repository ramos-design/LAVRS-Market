
export enum AppStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  WAITLIST = 'WAITLIST',
  PAID = 'PAID',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  PAYMENT_LAST_CALL = 'PAYMENT_LAST_CALL',
  EXPIRED = 'EXPIRED',
  PAYMENT_UNDER_REVIEW = 'PAYMENT_UNDER_REVIEW',
  DELETED = 'DELETED'
}

export enum SpotSize {
  S = 'S',
  M = 'M',
  L = 'L'
}

export type ZoneCategory = string;

export interface Category {
  id: string;
  name: string;
  description: string;
}



export interface MarketEvent {
  id: string;
  title: string;
  date: string;
  endDate?: string;
  location: string;
  status: 'open' | 'closed' | 'waitlist' | 'draft' | 'soldout';
  image: string;
  description?: string;
  capacity?: number;
  updatedAt?: string;
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
  extraNote?: string;
  paymentDeadline?: string;
  approvedAt?: string | null;
  invoiceId?: string;
  updatedAt?: string;
  customPrice?: number | null;
}

export interface Stand {
  id: string;
  x: number; // grid position x
  y: number; // grid position y
  size: SpotSize;
  zoneId: string;
  occupantId?: string; // ID of the application/brand
  label?: string;
  widthCells?: number;
  heightCells?: number;
  rotation?: 0 | 90;
  locked?: boolean;
}

export interface Zone {
  id: string;
  name: string;
  color: string;
  category: ZoneCategory;
  capacities: {
    [key in SpotSize]?: number;
  };
  capacity?: number;
}

export interface ExtraItem {
  id: string;
  label: string;
  price: string;
}

export interface EventPlan {
  id?: string;
  name?: string;
  eventId: string;
  zones: Zone[];
  stands: Stand[];
  gridSize: { width: number; height: number };
  layoutMeta?: {
    backgroundImageUrl?: string;
    backgroundOpacity?: number;
    cellSize?: number;
    originOffset?: { x: number; y: number };
  };
  prices: {
    [key: string]: string;
  };
  equipment: {
    [key: string]: string[];
  };
  categorySizes?: {
    [key: string]: string;
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
  billingName?: string;
  ic?: string;
  dic?: string;
  billingAddress?: string;
  billingEmail?: string;
  deletionRequestedAt?: string;
  trashedAt?: string;
  logoUrl?: string;
  galleryUrls?: string[];
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  tag: string;
  is_active: boolean;
}

export interface Invoice {
  id: string;
  applicationId: string;
  eventId?: string;
  invoiceNumber: string;
  amountCzk: number;
  issuedAt: string;
  dueDate: string;
  variableSymbol: string;
  pdfStoragePath?: string;
  xmlStoragePath?: string;
  pdfUrl?: string;
  xmlUrl?: string;
  createdAt: string;
}

export interface CompanySettings {
  id: string;
  companyName: string;
  companyAddress: string;
  ic: string;
  dic?: string;
  bankAccount: string;
  bankIban: string;
  bankSwift?: string;
  invoiceDueDays: number;
  invoiceNote?: string;
  phone?: string;
  email?: string;
  registrationInfo?: string;
  issuedBy?: string;
  accountingEmail?: string;
  updatedAt: string;
}
