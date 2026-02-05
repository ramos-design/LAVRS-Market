
import React, { useState } from 'react';
import { ViewMode, User as UserType, BrandProfile, ZoneType, Application, AppStatus } from './types';
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

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('EXHIBITOR');
  const [currentScreen, setCurrentScreen] = useState<string>('DASHBOARD');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Initial brand profiles
  const [brandProfiles, setBrandProfiles] = useState<BrandProfile[]>([
    {
      id: 'brand-1',
      brandName: 'Vintage Soul',
      brandDescription: 'Výběrový vintage shop se zaměřením na 90. léta a lokální rework. Naše kousky pečlivě vybíráme a vdechujeme jim nový život.',
      instagram: '@vintage.soul',
      website: 'vintagesoul.cz',
      contactPerson: 'Tereza Nováková',
      phone: '+420 777 123 456',
      email: 'tereza@vintagesoul.cz',
      zone: ZoneType.M,
      billingName: 'Vintage Soul s.r.o.',
      ic: '12345678',
      billingAddress: 'Vnitroblock, Holešovice, Praha',
      billingEmail: 'faktury@vintagesoul.cz'
    }
  ]);

  // Shared Applications State
  const [applications, setApplications] = useState<Application[]>([]);

  const handleAddApplication = (newApp: Application) => {
    setApplications(prev => [newApp, ...prev]);
    setCurrentScreen('APPLICATIONS');
  };

  const handleUpdateApplicationStatus = (id: string, newStatus: AppStatus) => {
    setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
  };

  const user: UserType = {
    name: viewMode === 'EXHIBITOR' ? 'Tereza (Vintage Soul)' : 'Admin Curator',
    role: viewMode,
    brand: viewMode === 'EXHIBITOR' ? 'Vintage Soul' : undefined
  };


  return (
    <div className="flex min-h-screen bg-lavrs-beige/30">
      {/* Role Switcher (Development Only) */}
      <div className="fixed bottom-4 right-4 z-50 flex gap-2 bg-white p-2 rounded-none shadow-lg border border-gray-100">
        <button
          onClick={() => { setViewMode('EXHIBITOR'); setCurrentScreen('DASHBOARD'); }}
          className={`px-4 py-1.5 rounded-none text-xs font-semibold transition-all ${viewMode === 'EXHIBITOR' ? 'bg-lavrs-red text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Exhibitor
        </button>
        <button
          onClick={() => { setViewMode('ADMIN'); setCurrentScreen('DASHBOARD'); }}
          className={`px-4 py-1.5 rounded-none text-xs font-semibold transition-all ${viewMode === 'ADMIN' ? 'bg-lavrs-dark text-white' : 'text-gray-500 hover:bg-gray-50'}`}
        >
          Admin
        </button>
      </div>

      <Sidebar
        role={viewMode}
        activeItem={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
      />

      <main className="flex-1 p-4 md:p-6 lg:p-12 overflow-y-auto max-h-screen">
        <div className="max-w-7xl mx-auto animate-fadeIn">
          {currentScreen === 'DASHBOARD' && (
            viewMode === 'EXHIBITOR' ? (
              <ExhibitorDashboard
                user={user}
                applications={applications}
                brands={brandProfiles}
                onApply={(id) => { setSelectedEventId(id); setCurrentScreen('APPLY'); }}
                onPayment={() => setCurrentScreen('PAYMENT')}
                onNavigate={setCurrentScreen}
              />
            ) : (
              <AdminDashboard
                user={user}
                onOpenCurator={() => setCurrentScreen('CURATOR')}
              />
            )
          )}

          {currentScreen === 'APPLY' && selectedEventId && (
            <ApplicationWizard
              eventId={selectedEventId}
              onCancel={() => setCurrentScreen('DASHBOARD')}
              savedBrands={brandProfiles}
              onSaveBrand={(brand) => {
                setBrandProfiles(prev => {
                  const exists = prev.find(b => b.id === brand.id);
                  if (exists) {
                    return prev.map(b => b.id === brand.id ? brand : b);
                  }
                  return [...prev, brand];
                });
              }}
              onApply={handleAddApplication}
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
            />
          )}

          {currentScreen === 'PAYMENTS' && (
            <PaymentsAndInvoicing />
          )}

          {currentScreen === 'EVENTS_CONFIG' && (
            <EventsConfig />
          )}

          {currentScreen === 'EMAILS' && (
            <AutomatedEmails />
          )}

          {currentScreen === 'PAYMENT' && (
            <PaymentPage onBack={() => setCurrentScreen('DASHBOARD')} />
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
