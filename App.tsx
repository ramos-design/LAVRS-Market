
import React, { useState, useMemo } from 'react';
import { ViewMode, User as UserType, BrandProfile, Application, AppStatus, Category, Banner } from './types';
import Sidebar from './components/Sidebar';
import ExhibitorDashboard from './components/ExhibitorDashboard';
import AdminDashboard from './components/AdminDashboard';
import ApplicationWizard from './components/ApplicationWizard';
import PaymentPage from './components/PaymentPage';
import CuratorModule from './components/CuratorModule';
import MyApplications from './components/MyApplications';
import Billing from './components/Billing';
import Profile from './components/Profile';
import PaymentsAndInvoicing from './components/PaymentsAndInvoicing';
import EventsConfig from './components/EventsConfig';
import AutomatedEmails from './components/AutomatedEmails';
import BrandsList from './components/BrandsList';
import EventLayoutManager from './components/EventLayoutManager';
import MobileHeader from './components/MobileHeader';
import BannerManager from './components/BannerManager';
import CategoryManager from './components/CategoryManager';
import Auth from './components/Auth';

// Supabase hooks & mappers
import { useAuth } from './hooks/useAuth';
import { useEvents, useApplications, useBrandProfiles, useEventPlan, useBanners, useCategories } from './hooks/useSupabase';
import {
  dbEventToApp, dbApplicationToApp, dbBrandProfileToApp,
  dbBannerToApp, dbCategoryToApp, dbEventPlanToApp,
  appApplicationToDb, appBrandProfileToDb, appBannerToDb, appCategoryToDb,
} from './lib/mappers';

const App: React.FC = () => {
  const { user, loading: authLoading, error: authError, signOut, refetch } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<string>('DASHBOARD');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Derived role from user
  const userRole = user?.role;


  // ─── Supabase data hooks ──────────────────────────────────
  const { events: dbEvents, loading: eventsLoading } = useEvents();
  const {
    applications: dbApplications, loading: appsLoading,
    createApplication, updateStatus: updateAppStatus, deleteApplication,
  } = useApplications();
  const {
    profiles: dbProfiles, loading: profilesLoading,
    createProfile, updateProfile,
  } = useBrandProfiles();
  const {
    banners: dbBanners, loading: bannersLoading,
    replaceAllBanners,
  } = useBanners();
  const {
    categories: dbCategories, loading: categoriesLoading,
    // category mutations are handled inside CategoryManager
  } = useCategories();
  const {
    plan: dbPlan, zones: dbZones, stands: dbStands,
    savePlan: saveEventPlan, loading: planLoading,
  } = useEventPlan(selectedEventId);

  // ─── Map DB data to app types ─────────────────────────────
  const events = useMemo(() => dbEvents.map(dbEventToApp), [dbEvents]);
  const applications = useMemo(() => dbApplications.map(dbApplicationToApp), [dbApplications]);
  const brandProfiles = useMemo(() => dbProfiles.map(dbBrandProfileToApp), [dbProfiles]);
  const banners = useMemo(() => dbBanners.map(dbBannerToApp), [dbBanners]);
  const categories = useMemo(() => dbCategories.map(dbCategoryToApp), [dbCategories]);
  const currentEventPlan = useMemo(() => {
    if (!dbPlan) return undefined;
    return dbEventPlanToApp(dbPlan, dbZones, dbStands);
  }, [dbPlan, dbZones, dbStands]);

  // ─── Handlers (now write to Supabase) ─────────────────────

  const handleUpdateEventPlan = async (_eventId: string, newPlan: any) => {
    await saveEventPlan({
      gridSize: newPlan.gridSize,
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
    const dbApp = appApplicationToDb(newApp);
    await createApplication(dbApp);
    setCurrentScreen('APPLICATIONS');
  };

  const handleUpdateApplicationStatus = async (id: string, newStatus: AppStatus) => {
    let paymentDeadline: string | undefined;
    if (newStatus === AppStatus.APPROVED) {
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
      paymentDeadline = new Date(Date.now() + fiveDaysMs).toISOString();
    }
    await updateAppStatus(id, newStatus, paymentDeadline);
  };

  const handleDeleteApplication = async (id: string) => {
    if (window.confirm('Opravdu chcete tuto přihlášku smazat? Tato akce je nevratná.')) {
      await deleteApplication(id);
    }
  };

  const handleSaveBrand = async (brand: BrandProfile) => {
    const dbBrand = appBrandProfileToDb(brand);
    const exists = dbProfiles.find(b => b.id === brand.id);
    if (exists) {
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
          <div className="w-16 h-16 border-4 border-lavrs-red/20 border-t-lavrs-red rounded-full animate-spin" />
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
        activeItem={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        onSignOut={signOut}
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
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin hidden group-disabled:block" />
                Zkusit znovu načíst
              </button>
            </div>
          )}

          {currentScreen === 'DASHBOARD' && (
            userRole === 'EXHIBITOR' ? (
              <ExhibitorDashboard
                user={currentUser}
                applications={applications}
                brands={brandProfiles}
                onApply={(id) => { setSelectedEventId(id); setCurrentScreen('APPLY'); }}
                onPayment={() => setCurrentScreen('PAYMENT')}
                onNavigate={setCurrentScreen}
                banners={banners}
              />
            ) : (
              <AdminDashboard
                user={currentUser}
                onOpenCurator={() => setCurrentScreen('CURATOR')}
                onManageEvent={(id) => { setSelectedEventId(id); setCurrentScreen('EVENT_PLAN'); }}
              />
            )
          )}

          {currentScreen === 'APPLY' && selectedEventId && (
            <ApplicationWizard
              eventId={selectedEventId}
              onCancel={() => setCurrentScreen('DASHBOARD')}
              onApply={handleAddApplication}
              eventPlan={currentEventPlan}
            />
          )}

          {currentScreen === 'APPLICATIONS' && (
            <MyApplications applications={applications} />
          )}

          {currentScreen === 'BILLING' && (
            <Billing />
          )}

          {currentScreen === 'PROFILE' && (
            <Profile initialBrands={brandProfiles} />
          )}

          {currentScreen === 'CURATOR' && (
            <CuratorModule
              onBack={() => setCurrentScreen('DASHBOARD')}
              applications={applications}
              onUpdateStatus={handleUpdateApplicationStatus}
              onDeleteApplication={handleDeleteApplication}
            />
          )}

          {currentScreen === 'PAYMENTS' && (
            <PaymentsAndInvoicing />
          )}

          {currentScreen === 'EVENTS_CONFIG' && (
            <EventsConfig onManageEvent={(id) => { setSelectedEventId(id); setCurrentScreen('EVENT_PLAN'); }} />
          )}

          {currentScreen === 'EMAILS' && (
            <AutomatedEmails />
          )}

          {currentScreen === 'BRANDS' && (
            <BrandsList applications={applications} brands={brandProfiles} />
          )}

          {currentScreen === 'PAYMENT' && (
            <PaymentPage
              onBack={() => setCurrentScreen('DASHBOARD')}
              initialBillingDetails={brandProfiles[0]}
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
            <EventLayoutManager
              eventId={selectedEventId}
              onBack={() => setCurrentScreen('DASHBOARD')}
              applications={applications}
              initialPlan={currentEventPlan}
              onSavePlan={(newPlan) => handleUpdateEventPlan(selectedEventId, newPlan)}
              categories={categories}
            />
          )}
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
