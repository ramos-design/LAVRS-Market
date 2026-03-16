
import React, { useState, useMemo, useEffect } from 'react';
import { ViewMode, User as UserType, BrandProfile, Application, AppStatus, Category, Banner } from './types';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import Auth from './components/Auth';
import HeartLoader from './components/HeartLoader';

// Supabase hooks & mappers
import { useAuth } from './hooks/useAuth';
import { useEvents, useApplications, useBrandProfiles, useEventPlan, useBanners, useCategories } from './hooks/useSupabase';
import {
  dbEventToApp, dbApplicationToApp, dbBrandProfileToApp,
  dbBannerToApp, dbCategoryToApp, dbEventPlanToApp,
  appApplicationToDb, appBrandProfileToDb, appBannerToDb, appCategoryToDb,
} from './lib/mappers';

const ExhibitorDashboard = React.lazy(() => import('./components/ExhibitorDashboard'));
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard'));
const ApplicationWizard = React.lazy(() => import('./components/ApplicationWizard'));
const PaymentPage = React.lazy(() => import('./components/PaymentPage'));
const CuratorModule = React.lazy(() => import('./components/CuratorModule'));
const MyApplications = React.lazy(() => import('./components/MyApplications'));
const Billing = React.lazy(() => import('./components/Billing'));
const Profile = React.lazy(() => import('./components/Profile'));
const Contact = React.lazy(() => import('./components/Contact'));
const PaymentsAndInvoicing = React.lazy(() => import('./components/PaymentsAndInvoicing'));
const EventsConfig = React.lazy(() => import('./components/EventsConfig'));
const AutomatedEmails = React.lazy(() => import('./components/AutomatedEmails'));
const BrandsList = React.lazy(() => import('./components/BrandsList'));
const EventLayoutManager = React.lazy(() => import('./components/EventLayoutManager'));
const BannerManager = React.lazy(() => import('./components/BannerManager'));
const CategoryManager = React.lazy(() => import('./components/CategoryManager'));

class EventPlanErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, message: error instanceof Error ? error.message : 'Unknown error' };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Event plan crashed', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white border border-red-200 p-8 shadow-sm">
          <h3 className="text-xl font-bold text-red-700 mb-2">Editor eventu spadl</h3>
          <p className="text-sm text-gray-600">Detail se nepodařilo vykreslit. Vrať se zpět a otevři event znovu.</p>
          <p className="text-xs text-gray-400 mt-3">Chyba: {this.state.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const App: React.FC = () => {
  const { user, loading: authLoading, error: authError, signOut, refetch } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<string>('DASHBOARD');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedPaymentAppId, setSelectedPaymentAppId] = useState<string | null>(null);
  const [locallyUnderReview, setLocallyUnderReview] = useState<string[]>(() => {
    const saved = localStorage.getItem('lavrs_locally_under_review');
    return saved ? JSON.parse(saved) : [];
  });
  const [dismissedReviewAppIds, setDismissedReviewAppIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('lavrs_dismissed_review_apps');
    return saved ? JSON.parse(saved) : [];
  });

  // Derived role from user
  const userRole = user?.role;
  const needsCategories =
    currentScreen === 'PAYMENT' ||
    currentScreen === 'APPLY' ||
    currentScreen === 'CATEGORIES' ||
    currentScreen === 'EVENT_PLAN';
  const needsBanners =
    currentScreen === 'BANNERS' ||
    (currentScreen === 'DASHBOARD' && userRole === 'EXHIBITOR');


  // ─── Supabase data hooks ──────────────────────────────────
  const { events: dbEvents, loading: eventsLoading, deleteEvent } = useEvents();
  const {
    applications: dbApplications, loading: appsLoading,
    createApplication, updateStatus: updateAppStatus, deleteApplication,
  } = useApplications();
  const {
    profiles: dbProfiles, loading: profilesLoading,
    createProfile, updateProfile, deleteProfile,
  } = useBrandProfiles();

  // DOČASNÝ ÚKLID DUPLICIT: Pokud najdeme více značek se stejným jménem, necháme jen tu první.
  useEffect(() => {
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
  }, [dbProfiles, profilesLoading]);

  const {
    banners: dbBanners, loading: bannersLoading,
    replaceAllBanners,
  } = useBanners(needsBanners);
  const {
    categories: dbCategories, loading: categoriesLoading,
    // category mutations are handled inside CategoryManager
  } = useCategories(needsCategories);
  const {
    plan: dbPlan, zones: dbZones, stands: dbStands,
    savePlan: saveEventPlan, loading: planLoading,
  } = useEventPlan(selectedEventId);

  // ─── Map DB data to app types ─────────────────────────────
  const events = useMemo(() => dbEvents.map(dbEventToApp), [dbEvents]);
  const brandProfiles = useMemo(() => dbProfiles.map(dbBrandProfileToApp), [dbProfiles]);
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
  }, [dbPlan, dbZones, dbStands]);

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

  const handleUpdateEventPlan = async (_eventId: string, newPlan: any) => {
    await saveEventPlan({
      gridSize: newPlan.gridSize,
      layoutMeta: newPlan.layoutMeta,
      prices: newPlan.prices,
      equipment: newPlan.equipment,
      categorySizes: newPlan.categorySizes,
      extras: newPlan.extras,
      zones: newPlan.zones.map((z: any) => ({
        id: z.id,
        name: z.name,
        color: z.color,
        category: z.category,
        capacities: z.capacities,
      })),
      stands: newPlan.stands.map((s: any) => ({
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
    let paymentDeadline: string | undefined;
    let approvedAt: string | undefined;
    if (newStatus === AppStatus.APPROVED) {
      const now = new Date();
      approvedAt = now.toISOString();
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
      paymentDeadline = new Date(now.getTime() + fiveDaysMs).toISOString();
    }
    return await updateAppStatus(id, newStatus, paymentDeadline, approvedAt);
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
    await deleteApplication(id);
  };

  const handleRestoreApplication = async (id: string) => {
    await updateAppStatus(id, AppStatus.PENDING);
  };

  const handleSaveBrand = async (brand: BrandProfile) => {
    const dbBrand = appBrandProfileToDb(brand, user?.id);
    if (brandProfiles.some(b => b.id === brand.id)) {
      await updateProfile(brand.id, dbBrand);
    } else {
      await createProfile(dbBrand);
    }
  };

  // Global loading state
  const isLoading = eventsLoading || appsLoading || profilesLoading || bannersLoading || categoriesLoading;

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
    return <Auth />;
  }

  const currentUser: UserType = {
    name: user.fullName || user.email.split('@')[0],
    role: userRole as ViewMode,
    brand: userRole === 'EXHIBITOR' ? 'Vaše značka' : undefined
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-lavrs-beige/30">


      <MobileHeader
        role={userRole as ViewMode}
      />
      
      <Sidebar
        role={userRole as ViewMode}
        activeItem={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onSignOut={signOut}
      />

      <main className="flex-1 p-4 md:p-6 lg:p-12 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
        <div className="max-w-7xl mx-auto animate-fadeIn">

          {/* Global loading indicator */}
          {isLoading && !authError && (
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-lavrs-dark text-white px-6 py-2 rounded-none shadow-lg text-sm font-bold flex items-center gap-2">
              <HeartLoader size={16} className="text-white" />
              Načítám data...
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
                onApply={(id) => { setSelectedEventId(id); setCurrentScreen('APPLY'); }}
                onPayment={(appId) => { setSelectedPaymentAppId(appId); setCurrentScreen('PAYMENT'); }}
                onDismissApp={handleDismissReviewApp}
                onNavigate={setCurrentScreen}
                banners={banners}
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
              />
            )
          )}

          {currentScreen === 'APPLY' && selectedEventId && (
            <ApplicationWizard
              eventId={selectedEventId}
              userId={user?.id}
              onCancel={() => setCurrentScreen('DASHBOARD')}
              onApply={handleAddApplication}
              eventPlan={currentEventPlan}
            />
          )}

          {currentScreen === 'APPLICATIONS' && (
            <MyApplications applications={applications} events={events} />
          )}

          {currentScreen === 'BILLING' && (
            <Billing applications={applications} brands={brandProfiles} />
          )}

          {currentScreen === 'CONTACT' && (
            <Contact />
          )}

          {currentScreen === 'PROFILE' && (
            <Profile initialBrands={brandProfiles} />
          )}

          {currentScreen === 'CURATOR' && (
            <CuratorModule
              onBack={() => setCurrentScreen('DASHBOARD')}
              events={events}
              applications={applications}
              onUpdateStatus={handleUpdateApplicationStatus}
              onDeleteApplication={handleDeleteApplication}
              onRestoreApplication={handleRestoreApplication}
            />
          )}

          {currentScreen === 'PAYMENTS' && (
            <PaymentsAndInvoicing applications={applications} events={events} />
          )}

          {currentScreen === 'EVENTS_CONFIG' && (
            <EventsConfig
              events={events}
              applications={applications}
              onDeleteEvent={deleteEvent}
              onManageEvent={(id) => { setSelectedEventId(id); setCurrentScreen('EVENT_PLAN'); }}
            />
          )}

          {currentScreen === 'EMAILS' && (
            <AutomatedEmails />
          )}

          {currentScreen === 'BRANDS' && (
            <BrandsList applications={applications} brands={brandProfiles} events={events} />
          )}

          {currentScreen === 'PAYMENT' && (
            <PaymentPage
              onBack={() => { setSelectedPaymentAppId(null); setCurrentScreen('DASHBOARD'); }}
              initialBillingDetails={brandProfiles[0]}
              activeApp={activeAppForExhibitor}
              activeEvent={activeEventForExhibitor}
              categories={categories}
              onUpdateStatus={async (id, status) => {
                // Bypass DB for this status as it's purely informative and constrained in DB
                if (status === AppStatus.PAYMENT_UNDER_REVIEW || status === 'PAYMENT_UNDER_REVIEW') {
                  handleLocalConfirmPayment(id);
                  return Promise.resolve();
                }
                return handleUpdateApplicationStatus(id, status);
              }}
              onSaveBilling={async (details) => {
                if (brandProfiles.length > 0) {
                  await handleSaveBrand({ ...brandProfiles[0], ...details });
                }
              }}
            />
          )}

          {currentScreen === 'BANNERS' && (
            <BannerManager
              banners={banners}
              onUpdateBanners={handleUpdateBanners}
            />
          )}

          {currentScreen === 'CATEGORIES' && (
            <CategoryManager
              categories={categories}
              onUpdateCategories={handleUpdateCategories}
            />
          )}

          {currentScreen === 'EVENT_PLAN' && selectedEventId && (
            <EventPlanErrorBoundary>
              <EventLayoutManager
                key={selectedEventId}
                eventId={selectedEventId}
                onBack={() => setCurrentScreen('EVENTS_CONFIG')}
                applications={applications}
                initialPlan={currentEventPlan}
                onSavePlan={(newPlan) => handleUpdateEventPlan(selectedEventId, newPlan)}
                categories={categories}
              />
            </EventPlanErrorBoundary>
          )}
          </React.Suspense>
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
  );
};


export default App;


