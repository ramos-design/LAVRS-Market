
import React, { useState, useMemo, useEffect } from 'react';
import { ViewMode, User as UserType, BrandProfile, Application, AppStatus, Category, Banner, EventPlan } from './types';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import Auth from './components/Auth';
import HeartLoader from './components/HeartLoader';

// Supabase hooks & mappers
import { useAuth } from './hooks/useAuth';
import { useEvents, useApplications, useBrandProfiles, useBrandTrash, useEventPlan, useEventPlans, useAllEventPlanPrices, useInvoices, useBanners, useCategories, useCompanySettings } from './hooks/useSupabase';
import { logAdminAction, checkVersionConflict } from './lib/activityLog';
import { useAdminPresence } from './hooks/useAdminPresence';
import {
  dbEventToApp, dbApplicationToApp, dbBrandProfileToApp,
  dbBannerToApp, dbCategoryToApp, dbEventPlanToApp,
  appApplicationToDb, appBrandProfileToDb, appBannerToDb, appCategoryToDb,
} from './lib/mappers';

// Retry wrapper for lazy imports — handles stale chunks after deploy
function lazyWithRetry(factory: () => Promise<{ default: React.ComponentType<any> }>) {
  return React.lazy(() =>
    factory().catch((err) => {
      // If chunk fetch failed and we haven't reloaded yet, do a full reload
      const key = 'chunk_reload';
      const lastReload = sessionStorage.getItem(key);
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 10_000) {
        sessionStorage.setItem(key, String(now));
        window.location.reload();
      }
      throw err;
    })
  );
}

// Prefetch map — allows Sidebar hover to trigger chunk downloads before click
const componentImports: Record<string, () => Promise<{ default: React.ComponentType<any> }>> = {
  DASHBOARD_EXHIBITOR: () => import('./components/ExhibitorDashboard'),
  DASHBOARD_ADMIN: () => import('./components/AdminDashboard'),
  APPLY: () => import('./components/ApplicationWizard'),
  PAYMENT: () => import('./components/PaymentPage'),
  CURATOR: () => import('./components/CuratorModule'),
  APPROVED_APPS: () => import('./components/ApprovedApplications'),
  APPLICATIONS: () => import('./components/MyApplications'),
  BILLING: () => import('./components/Billing'),
  PROFILE: () => import('./components/Profile'),
  CONTACT: () => import('./components/Contact'),
  PAYMENTS: () => import('./components/PaymentsAndInvoicing'),
  EVENTS_CONFIG: () => import('./components/EventsConfig'),
  EMAILS: () => import('./components/AutomatedEmails'),
  BRANDS: () => import('./components/BrandsList'),
  BRAND_TRASH: () => import('./components/BrandTrash'),
  EVENT_PLAN: () => import('./components/EventLayoutManager'),
  BANNERS: () => import('./components/BannerManager'),
  CATEGORIES: () => import('./components/CategoryManager'),
  TOAST: () => import('./components/ToastProvider'),
  RESET_PASSWORD: () => import('./components/ResetPassword'),
  PRIVACY: () => import('./components/PrivacyPolicy'),
  TERMS: () => import('./components/TermsOfService'),
};

// Prefetch a screen's chunk (no-op if already cached by browser)
const prefetchedScreens = new Set<string>();
export function prefetchScreen(screenId: string) {
  const keys = screenId === 'DASHBOARD'
    ? ['DASHBOARD_EXHIBITOR', 'DASHBOARD_ADMIN']
    : [screenId];
  keys.forEach(key => {
    if (prefetchedScreens.has(key)) return;
    const importer = componentImports[key];
    if (importer) {
      prefetchedScreens.add(key);
      importer().catch(() => { /* chunk prefetch failed — lazy load will retry */ });
    }
  });
}

const ExhibitorDashboard = lazyWithRetry(componentImports.DASHBOARD_EXHIBITOR);
const AdminDashboard = lazyWithRetry(componentImports.DASHBOARD_ADMIN);
const ApplicationWizard = lazyWithRetry(componentImports.APPLY);
const PaymentPage = lazyWithRetry(componentImports.PAYMENT);
const CuratorModule = lazyWithRetry(componentImports.CURATOR);
const ApprovedApplications = lazyWithRetry(componentImports.APPROVED_APPS);
const MyApplications = lazyWithRetry(componentImports.APPLICATIONS);
const Billing = lazyWithRetry(componentImports.BILLING);
const Profile = lazyWithRetry(componentImports.PROFILE);
const Contact = lazyWithRetry(componentImports.CONTACT);
const PaymentsAndInvoicing = lazyWithRetry(componentImports.PAYMENTS);
const EventsConfig = lazyWithRetry(componentImports.EVENTS_CONFIG);
const AutomatedEmails = lazyWithRetry(componentImports.EMAILS);
const BrandsList = lazyWithRetry(componentImports.BRANDS);
const BrandTrash = lazyWithRetry(componentImports.BRAND_TRASH);
const EventLayoutManager = lazyWithRetry(componentImports.EVENT_PLAN);
const BannerManager = lazyWithRetry(componentImports.BANNERS);
const CategoryManager = lazyWithRetry(componentImports.CATEGORIES);
const ToastProvider = lazyWithRetry(componentImports.TOAST);
const ResetPassword = lazyWithRetry(componentImports.RESET_PASSWORD);
const PrivacyPolicy = lazyWithRetry(componentImports.PRIVACY);
const TermsOfService = lazyWithRetry(componentImports.TERMS);

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, message: error instanceof Error ? error.message : 'Unknown error' };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('App section crashed', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border border-red-200 p-8 shadow-sm">
          <h3 className="text-xl font-bold text-red-700 mb-2">Něco se pokazilo</h3>
          <p className="text-sm text-gray-600">Nepodařilo se načíst obsah. Zkuste to znovu.</p>
          <p className="text-xs text-gray-400 mt-3 mb-4">Chyba: {this.state.message}</p>
          <button
            onClick={() => {
              // If the error is a failed chunk load, reload the page to get fresh assets
              if (this.state.message.includes('dynamically imported module') || this.state.message.includes('Failed to fetch')) {
                window.location.reload();
                return;
              }
              this.setState({ hasError: false, message: '' });
              this.props.onReset?.();
            }}
            className="bg-lavrs-red text-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-lavrs-dark transition-all"
          >
            Zkusit znovu
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const { user, loading: authLoading, error: authError, signOut, refetch, isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<string>('DASHBOARD');
  const hasLeftDashboard = React.useRef(false);

  React.useEffect(() => {
    if (currentScreen !== 'DASHBOARD') {
      hasLeftDashboard.current = true;
    }
  }, [currentScreen]);

  // Idle prefetch: after login, preload the most common screen chunks in background
  React.useEffect(() => {
    if (!user) return;
    const screens = user.role === 'ADMIN'
      ? ['DASHBOARD_ADMIN', 'CURATOR', 'APPROVED_APPS', 'EVENTS_CONFIG', 'BRANDS']
      : ['DASHBOARD_EXHIBITOR', 'APPLICATIONS', 'PROFILE'];
    const rIC = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 100) as unknown as number;
    const cIC = typeof cancelIdleCallback === 'function' ? cancelIdleCallback : (id: number) => clearTimeout(id);
    const id = rIC(() => screens.forEach(prefetchScreen), { timeout: 3000 });
    return () => cIC(id);
  }, [user]);

  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [selectedPaymentAppId, setSelectedPaymentAppId] = useState<string | null>(null);
  const [locallyUnderReview, setLocallyUnderReview] = useState<string[]>(() => {
    const saved = localStorage.getItem('lavrs_locally_under_review');
    return saved ? JSON.parse(saved) : [];
  });
  const [dismissedReviewAppIds, setDismissedReviewAppIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('lavrs_dismissed_review_apps');
    return saved ? JSON.parse(saved) : [];
  });

  // Admin presence tracking
  const { onlineAdmins } = useAdminPresence(
    user?.id ?? null,
    user?.fullName || user?.email?.split('@')[0] || '',
    user?.email || '',
    currentScreen,
    user?.role === 'ADMIN'
  );

  // Derived role from user
  const userRole = user?.role;
  const canFetchUserData = !authLoading && !!user;
  const needsCategories =
    currentScreen === 'PAYMENT' ||
    currentScreen === 'APPLY' ||
    currentScreen === 'CATEGORIES' ||
    currentScreen === 'EVENT_PLAN';
  const needsBanners =
    currentScreen === 'BANNERS' ||
    (currentScreen === 'DASHBOARD' && userRole === 'EXHIBITOR');


  // ─── Supabase data hooks ──────────────────────────────────
  const { events: dbEvents, loading: eventsLoading, deleteEvent, createEvent } = useEvents(canFetchUserData);
  const {
    applications: dbApplications, loading: appsLoading,
    createApplication, updateStatus: updateAppStatus, updateApplication, deleteApplication, permanentDeleteAllTrash, softDeleteByBrandProfileId, softDeleteByBrandName,
  } = useApplications({
    enabled: canFetchUserData,
    userId: user?.id,
    role: userRole,
  });
  const {
    profiles: dbProfiles, loading: profilesLoading,
    createProfile, updateProfile, deleteProfile,
    moveToTrash, restoreFromTrash, permanentDeleteBrand,
  } = useBrandProfiles({
    enabled: canFetchUserData,
    userId: user?.id,
    role: userRole,
  });
  const { trashedBrands: dbTrashedBrands } = useBrandTrash(canFetchUserData && userRole === 'ADMIN');

  // Auto-seed email templates on app startup (for ADMIN)
  React.useEffect(() => {
    if (userRole !== 'ADMIN' || !user?.id) return;
    (async () => {
      try {
        const { emailTemplatesDb } = await import('./lib/database');
        const templates = await emailTemplatesDb.getAll();
        const existingIds = new Set(templates.map(t => t.id));

        // Define required templates
        const requiredTemplates: Record<string, { name: string; subject: string; description: string; category: string; body: string }> = {
          'invoice-notification': {
            name: 'Nová objednávka (vystavovatel)',
            subject: 'Nová objednávka: {{brand_name}} — {{event_name}} ({{zone_type}})',
            description: 'Automatický email odeslaný vystavovateli po vygenerování objednávky s PDF přílohou.',
            category: 'payment',
            body: `Nová objednávka na LAVRS market!

{{order_table}}

V příloze najdete vygenerovanou objednávku (PDF).
Pokud jste tuto objednávku již zaplatili, tento e-mail prosím ignorujte.
Jakmile tým LAVRS market schválí Vaši platbu, obdržíte fakturu e-mailem a budete informováni o zařazení do eventu.`
          },
          'invoice-notification-admin': {
            name: 'Nová objednávka (admin)',
            subject: 'Nová objednávka: {{brand_name}} — {{event_name}} ({{zone_type}})',
            description: 'Automatický email odeslaný adminovi po vygenerování objednávky.',
            category: 'payment',
            body: `Nová objednávka na LAVRS market!

{{order_table}}

V příloze najdete vygenerovanou objednávku (PDF).`
          }
        };

        for (const [id, template] of Object.entries(requiredTemplates)) {
          if (!existingIds.has(id)) {
            await emailTemplatesDb.create({
              id,
              name: template.name,
              subject: template.subject,
              description: template.description,
              body: template.body,
              category: template.category,
              enabled: true,
              last_edited: new Date().toISOString(),
            } as any);
            console.log(`[App] Seeded email template: ${id}`);
          }
        }
      } catch (err) {
        console.warn('[App] Failed to seed email templates:', err);
      }
    })();
  }, [user?.id, userRole]);

  // DOČASNÝ ÚKLID DUPLICIT: Pokud najdeme více značek se stejným jménem, necháme jen tu první.
  useEffect(() => {
    if (userRole !== 'ADMIN') return;
    if (!profilesLoading && dbProfiles.length > 0) {
      const seen = new Set<string>();
      const toDelete: string[] = [];
      
      dbProfiles.forEach(b => {
        const nameKey = (b.brand_name || '').trim().toLowerCase();
        if (!nameKey) return;
        if (seen.has(nameKey)) {
          toDelete.push(b.id);
        } else {
          seen.add(nameKey);
        }
      });

      if (toDelete.length > 0) {
        console.warn(`Nalezeno ${toDelete.length} duplicitních značek. Odstraňuji...`);
        toDelete.forEach(id => deleteProfile(id));
      }
    }
  }, [dbProfiles, profilesLoading, deleteProfile, userRole]);

  const {
    banners: dbBanners, loading: bannersLoading,
    replaceAllBanners,
  } = useBanners(canFetchUserData && needsBanners);
  const {
    categories: dbCategories, loading: categoriesLoading,
    // category mutations are handled inside CategoryManager
  } = useCategories(canFetchUserData && needsCategories);
  const {
    plan: dbPlan, zones: dbZones, stands: dbStands,
    savePlan: saveEventPlan, loading: planLoading,
  } = useEventPlan(selectedEventId);
  const {
    plans: dbAllPlans,
    saveAllPlans,
    loading: allPlansLoading,
  } = useEventPlans(selectedEventId);
  const {
    data: dbCompanySettings, loading: companySettingsLoading,
  } = useCompanySettings({ enabled: canFetchUserData });
  const { planPrices } = useAllEventPlanPrices(canFetchUserData);
  const { data: invoices } = useInvoices({ enabled: canFetchUserData });

  // ─── Map DB data to app types ─────────────────────────────
  const events = useMemo(() => dbEvents.map(dbEventToApp), [dbEvents]);
  const brandProfiles = useMemo(() => dbProfiles.map(dbBrandProfileToApp), [dbProfiles]);
  const trashedBrands = useMemo(() => (dbTrashedBrands || []).map(dbBrandProfileToApp), [dbTrashedBrands]);
  const applications = useMemo(() => {
    return dbApplications.map(dbApplicationToApp).map(app => {
      if (locallyUnderReview.includes(app.id) && app.status !== AppStatus.PAID) {
        return { ...app, status: AppStatus.PAYMENT_UNDER_REVIEW };
      }
      return app;
    }).filter(app => {
      // Hide review apps that have been dismissed by the user
      if (app.status === AppStatus.PAYMENT_UNDER_REVIEW && dismissedReviewAppIds.includes(app.id)) {
        return false;
      }
      return true;
    });
  }, [dbApplications, locallyUnderReview, dismissedReviewAppIds]);
  const banners = useMemo(() => dbBanners.map(dbBannerToApp), [dbBanners]);
  const categories = useMemo(() => dbCategories.map(dbCategoryToApp), [dbCategories]);
  const currentEventPlan = useMemo(() => {
    if (!dbPlan) return undefined;
    // Guard against stale data from a previously selected event
    if (dbPlan.event_id !== selectedEventId) return undefined;
    try {
      return dbEventPlanToApp(dbPlan, dbZones, dbStands);
    } catch (err) {
      console.error('Failed to map event plan, falling back to empty plan', err, {
        plan: dbPlan,
        zones: dbZones,
        stands: dbStands,
      });
      return undefined;
    }
  }, [dbPlan, dbZones, dbStands, selectedEventId]);

  const allEventPlans = useMemo(() => {
    if (!dbAllPlans || dbAllPlans.length === 0) return [];
    return dbAllPlans
      .filter(p => p.plan.event_id === selectedEventId)
      .map(p => {
        try {
          return dbEventPlanToApp(p.plan, p.zones, p.stands);
        } catch { return null; }
      })
      .filter((p): p is EventPlan => p !== null);
  }, [dbAllPlans, selectedEventId]);

  const currentEvent = useMemo(() => {
    if (!selectedEventId) return undefined;
    return events.find(e => e.id === selectedEventId);
  }, [selectedEventId, events]);

  // useCompanySettings already returns mapped CompanySettings (not raw DB type)
  const companySettings = dbCompanySettings ?? null;

  const activeAppForExhibitor = useMemo(() => {
    if (userRole !== 'EXHIBITOR') return null;
    if (selectedPaymentAppId) {
      return applications.find(a => a.id === selectedPaymentAppId);
    }
    return applications.find(a => [AppStatus.APPROVED, AppStatus.PAYMENT_REMINDER, AppStatus.PAYMENT_LAST_CALL, AppStatus.PAYMENT_UNDER_REVIEW].includes(a.status));
  }, [applications, userRole, selectedPaymentAppId]);

  const activeEventForExhibitor = useMemo(() => {
    return activeAppForExhibitor ? events.find(e => e.id === activeAppForExhibitor.eventId) : null;
  }, [activeAppForExhibitor, events]);

  // ─── Handlers (now write to Supabase) ─────────────────────

  const mapPlanForSave = (plan: any) => ({
    id: plan.id || `plan-${selectedEventId}-${Date.now()}`,
    gridSize: plan.gridSize,
    layoutMeta: { ...plan.layoutMeta, planName: plan.name || '' },
    prices: plan.prices,
    equipment: plan.equipment,
    categorySizes: plan.categorySizes,
    extras: plan.extras,
    zones: plan.zones.map((z: any) => ({
      id: z.id,
      name: z.name,
      color: z.color,
      category: z.category,
      capacities: z.capacity !== undefined
        ? { S: 0, M: z.capacity, L: 0 }
        : z.capacities,
    })),
    stands: plan.stands.map((s: any) => ({
      id: s.id,
      x: s.x,
      y: s.y,
      size: s.size,
      zone_id: s.zoneId,
      occupant_id: s.occupantId || null,
      label: s.label || null,
      width_cells: s.widthCells ?? 1,
      height_cells: s.heightCells ?? 1,
      rotation: s.rotation ?? 0,
      locked: !!s.locked,
    })),
  });

  const handleUpdateEventPlan = async (_eventId: string, newPlan: any) => {
    await saveEventPlan(mapPlanForSave(newPlan));
    if (user) {
      const evt = events.find(e => e.id === _eventId);
      logAdminAction({
        adminId: user.id,
        adminName: user.fullName || user.email,
        action: 'event_plan_saved',
        entityType: 'event_plan',
        entityId: _eventId,
        metadata: { eventTitle: evt?.title },
      });
    }
  };

  const handleSaveAllPlans = async (_eventId: string, plans: any[]) => {
    await saveAllPlans(plans.map(mapPlanForSave));
    if (user) {
      const evt = events.find(e => e.id === _eventId);
      logAdminAction({
        adminId: user.id,
        adminName: user.fullName || user.email,
        action: 'event_plan_saved',
        entityType: 'event_plan',
        entityId: _eventId,
        metadata: { eventTitle: evt?.title, planCount: plans.length },
      });
    }
  };

  const handleUpdateBanners = async (newBanners: Banner[]) => {
    const dbBannerList = newBanners.map((b, i) => appBannerToDb(b, i));
    await replaceAllBanners(dbBannerList);
  };

  const handleUpdateCategories = async (newCategories: Category[]) => {
    // For now, categories are managed inside CategoryManager with its own hooks
    // This callback is kept for backwards compatibility
  };

  const handleAddApplication = async (newApp: Application) => {
    try {
      const dbApp = appApplicationToDb(newApp, user?.id);
      await createApplication(dbApp);
      setCurrentScreen('APPLICATIONS');
    } catch (err: any) {
      console.error("Submission failed:", err);
      alert(`Odeslání přihlášky selhalo: ${err.message || "Zkuste to prosím znovu."}`);
    }
  };

  const handleUpdateApplicationStatus = async (id: string, newStatus: AppStatus) => {
    const app = applications.find(a => a.id === id);
    // Optimistic locking: check if another admin modified this application
    // Skip conflict check for PAYMENT_UNDER_REVIEW — exhibitor confirming payment
    // after admin approval is expected, not a conflict
    if (app?.updatedAt && newStatus !== AppStatus.PAYMENT_UNDER_REVIEW) {
      const { conflict } = await checkVersionConflict('applications', id, app.updatedAt);
      if (conflict) {
        const proceed = window.confirm(
          'Pozor: Tato přihláška byla mezitím upravena jiným adminem. Chcete přesto pokračovat a přepsat změny?'
        );
        if (!proceed) return null;
      }
    }
    let paymentDeadline: string | undefined;
    let approvedAt: string | undefined;
    if (newStatus === AppStatus.APPROVED) {
      const now = new Date();
      approvedAt = now.toISOString();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
      paymentDeadline = new Date(now.getTime() + sevenDaysMs).toISOString();
    }

    // When confirming payment (PAID), verify invoice exists and regenerate PDF as "DAŇOVÝ DOKLAD"
    // before status change so the DB trigger's send-email function can fetch it from storage
    if (newStatus === AppStatus.PAID) {
      // Check that an invoice exists — without it the payment-confirmed email
      // will be sent with empty amount and invoice number
      try {
        const { invoicesDb } = await import('./lib/database');
        const existingInvoice = await invoicesDb.getByApplicationId(id);
        if (!existingInvoice) {
          alert('Nelze potvrdit platbu — pro tuto přihlášku neexistuje faktura.\n\nVystavovatel musí nejprve dokončit objednávku na platební stránce, aby se vygenerovala faktura.');
          return null;
        }
      } catch (err) {
        console.warn('[Admin] Invoice check failed:', err);
        const proceed = window.confirm(
          'Nepodařilo se ověřit existenci faktury. Chcete přesto pokračovat?\n\nPokud faktura neexistuje, e-mail o potvrzení platby bude odeslán bez částky a čísla faktury.'
        );
        if (!proceed) return null;
      }

      try {
        const { regeneratePaidInvoicePdf } = await import('./lib/invoice-storage');
        const paidResult = await regeneratePaidInvoicePdf(id);
        if (paidResult.success) {
          console.log('[Admin] Paid invoice PDF regenerated successfully for:', app?.brandName);

          // Email notifications (exhibitor + admin + accounting) are handled by
          // DB trigger (applications_send_email_update) when status changes to PAID.
          // The trigger's send-email function fetches the paid PDF + ISDOC from storage.
        } else {
          console.warn('[Admin] Could not regenerate paid invoice PDF — original will be used');
        }
      } catch (err) {
        console.warn('[Admin] Paid PDF regeneration failed:', err);
      }
    }

    const result = await updateAppStatus(id, newStatus, paymentDeadline, approvedAt);
    if (user) {
      logAdminAction({
        adminId: user.id,
        adminName: user.fullName || user.email,
        action: 'application_status_changed',
        entityType: 'application',
        entityId: id,
        metadata: { brandName: app?.brandName, newStatus, previousStatus: app?.status },
      });
    }

    return result;
  };

  const handleLocalConfirmPayment = (appId: string) => {
    setLocallyUnderReview(prev => {
      const next = [...prev, appId];
      localStorage.setItem('lavrs_locally_under_review', JSON.stringify(next));
      return next;
    });
  };

  const handleDismissReviewApp = (appId: string) => {
    setDismissedReviewAppIds(prev => {
      const next = [...prev, appId];
      localStorage.setItem('lavrs_dismissed_review_apps', JSON.stringify(next));
      return next;
    });
  };

  const handleDeleteApplication = async (id: string) => {
    const app = applications.find(a => a.id === id);
    await deleteApplication(id);
    if (user) {
      logAdminAction({
        adminId: user.id,
        adminName: user.fullName || user.email,
        action: 'application_deleted',
        entityType: 'application',
        entityId: id,
        metadata: { brandName: app?.brandName },
      });
    }
  };

  const handleRestoreApplication = async (id: string) => {
    const app = applications.find(a => a.id === id);
    await updateAppStatus(id, AppStatus.PENDING);
    if (user) {
      logAdminAction({
        adminId: user.id,
        adminName: user.fullName || user.email,
        action: 'application_restored',
        entityType: 'application',
        entityId: id,
        metadata: { brandName: app?.brandName },
      });
    }
  };

  const handlePermanentDeleteAllTrash = async () => {
    await permanentDeleteAllTrash();
    if (user) {
      logAdminAction({
        adminId: user.id,
        adminName: user.fullName || user.email,
        action: 'all_trash_permanently_deleted',
        entityType: 'application',
        entityId: 'bulk',
        metadata: {},
      });
    }
  };

  const handleSaveBrand = async (brand: BrandProfile) => {
    const dbBrand = appBrandProfileToDb(brand, user?.id);
    if (brandProfiles.some(b => b.id === brand.id)) {
      await updateProfile(brand.id, dbBrand);
    } else {
      await createProfile(dbBrand);
    }
  };

  const handleDeleteBrandProfile = async (brandProfileId: string) => {
    // Look up the brand name so we can cascade-delete applications by name
    const profile = brandProfiles.find(bp => bp.id === brandProfileId);
    const brandName = profile?.brandName;

    // Cascade: soft-delete all applications linked to this brand
    await softDeleteByBrandProfileId(brandProfileId);
    if (brandName) {
      await softDeleteByBrandName(brandName);
    }

    // Then delete the brand profile itself
    await deleteProfile(brandProfileId);
  };

  const handleTrashBrand = async (brandProfileId: string, brandName: string) => {
    // Soft-delete all applications linked to this brand
    await softDeleteByBrandProfileId(brandProfileId);
    if (brandName) {
      await softDeleteByBrandName(brandName);
    }
    // Move brand to trash
    await moveToTrash(brandProfileId);
    if (user) {
      logAdminAction({
        adminId: user.id,
        adminName: user.fullName || user.email,
        action: 'brand_trashed',
        entityType: 'brand',
        entityId: brandProfileId,
        metadata: { brandName },
      });
    }
  };

  const handleRestoreBrand = async (brandProfileId: string) => {
    const brand = trashedBrands.find(b => b.id === brandProfileId);
    await restoreFromTrash(brandProfileId);
    // Restore applications linked to this brand back to PENDING
    if (brand?.brandName) {
      // We use the existing applications data to find DELETED apps for this brand
      const deletedApps = applications.filter(
        a => a.brandName.toLowerCase() === brand.brandName.toLowerCase() && a.status === AppStatus.DELETED
      );
      for (const app of deletedApps) {
        await updateAppStatus(app.id, AppStatus.PENDING);
      }
    }
    if (user) {
      logAdminAction({
        adminId: user.id,
        adminName: user.fullName || user.email,
        action: 'brand_restored',
        entityType: 'brand',
        entityId: brandProfileId,
        metadata: { brandName: brand?.brandName },
      });
    }
  };

  const handlePermanentDeleteBrand = async (brandProfileId: string, brandName: string) => {
    // Permanently delete all applications linked to this brand
    const deletedApps = applications.filter(
      a => a.brandName.toLowerCase() === brandName.toLowerCase() && a.status === AppStatus.DELETED
    );
    for (const app of deletedApps) {
      await deleteApplication(app.id);
    }
    // Permanently delete the brand profile
    await permanentDeleteBrand(brandProfileId);
    if (user) {
      logAdminAction({
        adminId: user.id,
        adminName: user.fullName || user.email,
        action: 'brand_permanently_deleted',
        entityType: 'brand',
        entityId: brandProfileId,
        metadata: { brandName },
      });
    }
  };

  const handleSaveBilling = async (details: Partial<BrandProfile>) => {
    if (!activeAppForExhibitor || !user?.id) return;

    const billingFields = {
      billing_name: details.billingName || null,
      ic: details.ic || null,
      dic: details.dic || null,
      billing_address: details.billingAddress || null,
      billing_email: details.billingEmail || null,
    };

    try {
      // 1. Save billing to the active application
      await updateApplication(activeAppForExhibitor.id, billingFields);

      // 2. Save billing to the matching brand profile (so it pre-fills next time)
      const matchingProfile = brandProfiles.find(
        bp => bp.brandName.toLowerCase() === activeAppForExhibitor.brandName.toLowerCase()
      );
      if (matchingProfile) {
        await updateProfile(matchingProfile.id, billingFields);
      }
    } catch (err) {
      console.error('Failed to save billing details:', err);
    }
  };

  const handleCreateEvent = async () => {
    if (creatingEvent) return;
    setCreatingEvent(true);
    try {
      const eventId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `event-${Date.now()}`;

      const newEvent = await createEvent({
        id: eventId,
        title: 'Nový event',
        date: new Date().toISOString().slice(0, 10),
        location: '',
        status: 'draft',
        image: '/media/lavrs-market.webp',
        description: null,
      });

      if (!newEvent?.id) {
        throw new Error('Event byl vytvořen bez ID.');
      }

      setSelectedEventId(newEvent.id);
      setCurrentScreen('EVENT_PLAN');
      if (user) {
        logAdminAction({
          adminId: user.id,
          adminName: user.fullName || user.email,
          action: 'event_created',
          entityType: 'event',
          entityId: newEvent.id,
          metadata: { eventTitle: newEvent.title },
        });
      }
    } catch (error: any) {
      console.error('Create event failed:', error);
      const msg = error?.message || 'Vytvoření eventu selhalo.';
      alert(`Vytvoření eventu selhalo: ${msg}`);
    } finally {
      setCreatingEvent(false);
    }
  };

  // Global loading state
  const isLoading = eventsLoading || appsLoading || profilesLoading || bannersLoading || categoriesLoading;

  // MUST be before any conditional returns — hooks cannot be called conditionally
  const currentUser = useMemo(() => ({
    name: user?.fullName || user?.email?.split('@')[0] || '',
    role: (userRole ?? 'EXHIBITOR') as ViewMode,
    brand: userRole === 'EXHIBITOR' ? 'Vaše značka' : undefined
  } as UserType), [user, userRole]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <HeartLoader size={64} className="text-lavrs-red" />
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Inicializace systému...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Zkontroluj, zda je na stránce reset hesla
    const isResetPasswordPage = window.location.pathname.includes('/auth/reset-password') ||
                              window.location.pathname.includes('/reset-password');

    // Zkontroluj, zda v URL je recovery token (implicit flow: hash, PKCE flow: code param)
    const hasRecoveryToken = window.location.hash.includes('type=recovery') && window.location.hash.includes('access_token');
    const hasCodeParam = new URLSearchParams(window.location.search).has('code');

    if (isResetPasswordPage || hasRecoveryToken || (hasCodeParam && !user)) {
      return (
        <React.Suspense fallback={
          <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center">
            <HeartLoader size={64} className="text-lavrs-red" />
          </div>
        }>
          <ResetPassword
            onSuccess={() => window.location.href = '/'}
            onCancel={() => window.location.href = '/'}
          />
        </React.Suspense>
      );
    }

    return <Auth />;
  }

  // Uživatel je přihlášen přes recovery link → zobrazit formulář pro změnu hesla
  if (isPasswordRecovery) {
    return (
      <React.Suspense fallback={
        <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center">
          <HeartLoader size={64} className="text-lavrs-red" />
        </div>
      }>
        <ResetPassword
          onSuccess={() => {
            clearPasswordRecovery();
            window.location.hash = '';
          }}
          onCancel={() => {
            clearPasswordRecovery();
            window.location.hash = '';
          }}
        />
      </React.Suspense>
    );
  }

  return (
    <React.Suspense fallback={
      <div className="min-h-screen bg-[#0F0F12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <HeartLoader size={64} className="text-lavrs-red" />
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Načítám aplikaci...</p>
        </div>
      </div>
    }>
    <ToastProvider currentUserId={user?.id ?? null} enabled={userRole === 'ADMIN'}>
    <div className="flex flex-col md:flex-row min-h-screen bg-lavrs-beige/30">


      <MobileHeader
        role={userRole as ViewMode}
        activeItem={currentScreen}
        onNavigate={setCurrentScreen}
        onSignOut={signOut}
      />

      <Sidebar
        role={userRole as ViewMode}
        activeItem={currentScreen}
        onNavigate={setCurrentScreen}
        onSignOut={signOut}
        onlineAdmins={onlineAdmins}
      />

      <main className="flex-1 p-4 md:p-6 lg:p-12 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
        <div className={`mx-auto animate-fadeIn ${currentScreen === 'BRANDS' || currentScreen === 'BRAND_TRASH' ? 'max-w-full' : 'max-w-7xl'}`}>

          {/* Global loading indicator */}
          {isLoading && !authError && (
            <div className="fixed bottom-4 right-4 z-50 bg-lavrs-dark text-white px-6 py-3 rounded shadow-lg text-sm font-bold flex items-center gap-2">
              <HeartLoader size={16} className="text-white" />
              Načítám...
            </div>
          )}

          {authError && (
            <div className="mb-8 bg-amber-50 border-l-4 border-amber-500 p-6 shadow-sm animate-fadeIn flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="text-amber-500 font-bold text-2xl animate-pulse">⚠️</div>
                <div>
                  <p className="text-amber-800 font-black text-sm uppercase tracking-wider">Upozornění k profilu</p>
                  <p className="text-amber-700 text-xs mt-1">{authError}</p>
                </div>
              </div>
              <button
                onClick={() => refetch()}
                className="whitespace-nowrap bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2"
              >
                <HeartLoader size={14} className="text-white hidden group-disabled:block" />
                Zkusit znovu načíst
              </button>
            </div>
          )}

          <AppErrorBoundary onReset={() => setCurrentScreen('DASHBOARD')}>
          <React.Suspense fallback={
            <div className="py-16 text-center text-gray-500 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              <HeartLoader size={16} className="text-lavrs-red" />
              Načítám modul...
            </div>
          }>
          {currentScreen === 'DASHBOARD' && (
            userRole === 'EXHIBITOR' ? (
              <ExhibitorDashboard
                user={currentUser}
                events={events}
                applications={applications}
                brands={brandProfiles}
                showGreeting={!hasLeftDashboard.current}
                onApply={(id) => { setSelectedEventId(id); setCurrentScreen('APPLY'); }}
                onPayment={(appId) => { setSelectedPaymentAppId(appId); setCurrentScreen('PAYMENT'); }}
                onDismissApp={handleDismissReviewApp}
                onNavigate={setCurrentScreen}
                banners={banners.filter(b => b.is_active)}
              />
            ) : (
              <AdminDashboard
                user={currentUser}
                events={events}
                applications={applications}
                brands={brandProfiles}
                onOpenCurator={() => setCurrentScreen('CURATOR')}
                onManageEvent={(id) => { setSelectedEventId(id); setCurrentScreen('EVENT_PLAN'); }}
                onOpenEventsConfig={() => setCurrentScreen('EVENTS_CONFIG')}
                onCreateEvent={handleCreateEvent}
              />
            )
          )}

          {currentScreen === 'APPLY' && selectedEventId && userRole === 'EXHIBITOR' && (
            <ApplicationWizard
              eventId={selectedEventId}
              userId={user?.id}
              userEmail={user?.email}
              onCancel={() => setCurrentScreen('DASHBOARD')}
              onApply={handleAddApplication}
              eventPlan={currentEventPlan}
            />
          )}

          {currentScreen === 'APPLICATIONS' && userRole === 'EXHIBITOR' && (
            <MyApplications applications={applications} events={events} />
          )}

          {/* BILLING tab disabled for exhibitors — invoices are sent via email */}

          {currentScreen === 'CONTACT' && (
            <Contact />
          )}

          {currentScreen === 'PRIVACY' && (
            <PrivacyPolicy onBack={() => setCurrentScreen('DASHBOARD')} />
          )}

          {(currentScreen === 'TERMS' || currentScreen === 'STORNO') && (
            <TermsOfService onBack={() => setCurrentScreen('DASHBOARD')} scrollToStorno={currentScreen === 'STORNO'} />
          )}

          {currentScreen === 'PROFILE' && (
            <Profile initialBrands={brandProfiles} />
          )}

          {currentScreen === 'CURATOR' && userRole === 'ADMIN' && (
            <CuratorModule
              onBack={() => setCurrentScreen('DASHBOARD')}
              events={events}
              applications={applications}
              brandProfiles={brandProfiles}
              planPrices={planPrices}
              onUpdateStatus={handleUpdateApplicationStatus}
              onUpdateApplication={updateApplication}
              onDeleteApplication={handleDeleteApplication}
              onRestoreApplication={handleRestoreApplication}
              onPermanentDeleteAllTrash={handlePermanentDeleteAllTrash}
              onTrashBrand={handleTrashBrand}
            />
          )}

          {currentScreen === 'APPROVED_APPS' && userRole === 'ADMIN' && (
            <ApprovedApplications
              onBack={() => setCurrentScreen('DASHBOARD')}
              events={events}
              applications={applications}
              brandProfiles={brandProfiles}
              onTrashBrand={handleTrashBrand}
              onNavigateToTrash={() => setCurrentScreen('BRAND_TRASH')}
              trashedCount={trashedBrands.length}
              planPrices={planPrices}
            />
          )}

          {currentScreen === 'BRAND_TRASH' && userRole === 'ADMIN' && (
            <BrandTrash
              trashedBrands={trashedBrands}
              applications={applications}
              onRestore={handleRestoreBrand}
              onPermanentDelete={handlePermanentDeleteBrand}
              onBack={() => setCurrentScreen('APPROVED_APPS')}
            />
          )}

          {currentScreen === 'PAYMENTS' && userRole === 'ADMIN' && (
            <PaymentsAndInvoicing applications={applications} events={events} planPrices={planPrices} invoices={invoices} />
          )}

          {currentScreen === 'EVENTS_CONFIG' && userRole === 'ADMIN' && (
            <EventsConfig
              events={events}
              applications={applications}
              onDeleteEvent={async (eventId: string) => {
                const evt = events.find(e => e.id === eventId);
                await deleteEvent(eventId);
                if (user) {
                  logAdminAction({
                    adminId: user.id,
                    adminName: user.fullName || user.email,
                    action: 'event_deleted',
                    entityType: 'event',
                    entityId: eventId,
                    metadata: { eventTitle: evt?.title },
                  });
                }
              }}
              onManageEvent={(id) => { setSelectedEventId(id); setCurrentScreen('EVENT_PLAN'); }}
              onCreateEvent={handleCreateEvent}
            />
          )}

          {currentScreen === 'EMAILS' && userRole === 'ADMIN' && (
            <AutomatedEmails />
          )}

          {currentScreen === 'BRANDS' && userRole === 'ADMIN' && (
            <BrandsList
              applications={applications}
              brands={brandProfiles}
              events={events}
              onDeleteBrand={handleDeleteBrandProfile}
              onUpdateBrand={handleSaveBrand}
              onTrashBrand={handleTrashBrand}
            />
          )}

          {currentScreen === 'PAYMENT' && userRole === 'EXHIBITOR' && (
            <PaymentPage
              onBack={() => { setSelectedPaymentAppId(null); setCurrentScreen('DASHBOARD'); }}
              initialBillingDetails={
                brandProfiles.find(bp => activeAppForExhibitor && bp.brandName.toLowerCase() === activeAppForExhibitor.brandName.toLowerCase())
                || brandProfiles[0]
              }
              onSaveBilling={handleSaveBilling}
              activeApp={activeAppForExhibitor}
              activeEvent={activeEventForExhibitor}
              categories={categories}
              companySettings={companySettings}
              allApplications={applications}
              onUpdateStatus={async (id, status) => {
                // Update status in DB so triggers fire (emails, etc.)
                const result = await handleUpdateApplicationStatus(id, status);
                // Also track locally for UI optimistic updates
                if (status === AppStatus.PAYMENT_UNDER_REVIEW || status === 'PAYMENT_UNDER_REVIEW') {
                  handleLocalConfirmPayment(id);
                }
                return result;
              }}
            />
          )}

          {currentScreen === 'BANNERS' && userRole === 'ADMIN' && (
            <BannerManager
              banners={banners}
              onUpdateBanners={handleUpdateBanners}
            />
          )}

          {currentScreen === 'CATEGORIES' && userRole === 'ADMIN' && (
            <CategoryManager
              categories={categories}
              onUpdateCategories={handleUpdateCategories}
            />
          )}

          {currentScreen === 'EVENT_PLAN' && selectedEventId && userRole === 'ADMIN' && (
            <AppErrorBoundary>
              <EventLayoutManager
                key={selectedEventId}
                eventId={selectedEventId}
                onBack={() => setCurrentScreen('EVENTS_CONFIG')}
                applications={applications}
                initialPlan={currentEventPlan}
                initialPlans={allEventPlans}
                onSavePlan={(newPlan) => handleUpdateEventPlan(selectedEventId, newPlan)}
                onSavePlans={(plans) => handleSaveAllPlans(selectedEventId, plans)}
                categories={categories}
              />
            </AppErrorBoundary>
          )}
          </React.Suspense>
          </AppErrorBoundary>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
    </ToastProvider>
    </React.Suspense>
  );
};


export default App;

