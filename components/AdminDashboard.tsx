
import React from 'react';
import { Plus, Users, ShoppingBag, LayoutGrid, List, MoreVertical, TrendingUp, Calendar } from 'lucide-react';
import { AppStatus, User, MarketEvent, Application, BrandProfile } from '../types';
import { formatEventDateRange } from '../lib/mappers';
import { eventPlansDb } from '../lib/database';
import { useAdminActivity } from '../hooks/useAdminActivity';

interface AdminDashboardProps {
  user: User;
  events: MarketEvent[];
  applications: Application[];
  brands: BrandProfile[];
  onOpenCurator: () => void;
  onManageEvent?: (eventId: string) => void;
  onOpenEventsConfig?: () => void;
  onCreateEvent?: () => void;
}

// Module-level formatters for performance
const formatCurrency = (num: number) => new Intl.NumberFormat('cs-CZ').format(num) + ' Kč';
const activityDateFormatter = new Intl.DateTimeFormat('cs-CZ', {
  day: 'numeric', month: 'short',
  hour: '2-digit', minute: '2-digit'
});

const AdminDashboardInner: React.FC<AdminDashboardProps> = ({ user, events, applications, brands, onOpenCurator, onManageEvent, onOpenEventsConfig, onCreateEvent }) => {
  const { activities, loading: activitiesLoading } = useAdminActivity(true);
  const normalizeId = React.useCallback((value?: string | null) => (value || '').trim().toLowerCase(), []);

  const sortedEvents = React.useMemo(() => {
    const parsed = [...events];
    const parseDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d.getTime();
      const trimmed = dateStr.replace(/\s+/g, ' ').trim();
      const numeric = trimmed.match(/(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})/);
      if (numeric) {
        const day = parseInt(numeric[1], 10);
        const month = parseInt(numeric[2], 10);
        const year = parseInt(numeric[3], 10);
        return new Date(year, month - 1, day).getTime();
      }
      const range = trimmed.match(/(\d{1,2})\.\s*[–-]\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(\d{4})/);
      if (range) {
        const day = parseInt(range[1], 10);
        const month = parseInt(range[3], 10);
        const year = parseInt(range[4], 10);
        return new Date(year, month - 1, day).getTime();
      }
      const monthMap: Record<string, number> = {
        ledna: 1, února: 2, března: 3, dubna: 4, května: 5, června: 6,
        července: 7, srpna: 8, září: 9, října: 10, listopadu: 11, prosince: 12
      };
      const named = trimmed.match(/(\d{1,2})\.\s*([a-zá-ž]+)\s*(\d{4})/i);
      if (named) {
        const day = parseInt(named[1], 10);
        const monthName = named[2].toLowerCase();
        const year = parseInt(named[3], 10);
        const month = monthMap[monthName];
        if (month) return new Date(year, month - 1, day).getTime();
      }
      return Number.NEGATIVE_INFINITY;
    };
    return parsed.sort((a, b) => parseDate(a.date) - parseDate(b.date));
  }, [events]);
  const [eventStats, setEventStats] = React.useState<Record<string, { occupied: number, total: number }>>({});
  const [eventPrices, setEventPrices] = React.useState<Record<string, Record<string, string>>>({});
  const [loadingStats, setLoadingStats] = React.useState<Set<string>>(new Set());

  // Lazy load event stats only when needed (not on mount with Promise.all)
  // Use stable reference with useCallback - NO eventStats/loadingStats in dependency!
  const loadEventStats = React.useCallback(async (eventId: string) => {
    setLoadingStats(prev => {
      // Skip if already loaded or currently loading
      if (prev.has(eventId)) return prev;
      return new Set([...prev, eventId]);
    });

    try {
      const { plan, zones, stands } = await eventPlansDb.getByEventId(eventId);

      if (!plan) {
        setEventStats(prev => ({ ...prev, [eventId]: { occupied: 0, total: 0 } }));
        setEventPrices(prev => ({ ...prev, [eventId]: {} }));
      } else {
        const prices = (plan.prices as Record<string, string>) || {};
        let totalCapacity = 0;
        zones.forEach((z) => {
          const caps = z.capacities as any;
          totalCapacity += ((caps.S || 0) + (caps.M || 0) + (caps.L || 0));
        });
        const occupied = stands.filter((s) => s.occupant_id).length;

        setEventStats(prev => ({ ...prev, [eventId]: { occupied, total: totalCapacity } }));
        setEventPrices(prev => ({ ...prev, [eventId]: prices }));
      }
    } catch (err) {
      console.error(`Failed to load stats for event ${eventId}:`, err);
      setEventStats(prev => ({ ...prev, [eventId]: { occupied: 0, total: 0 } }));
      setEventPrices(prev => ({ ...prev, [eventId]: {} }));
    } finally {
      setLoadingStats(prev => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  }, []);

  // Trigger lazy loading for each event when sortedEvents changes
  // loadEventStats is memoized with empty deps, so it's stable
  // The internal state checks prevent double-loading even if this runs multiple times
  React.useEffect(() => {
    sortedEvents.forEach(event => {
      loadEventStats(event.id);
    });
  }, [sortedEvents, loadEventStats]);

  const getEventStat = (eventId: string) => eventStats[eventId] || { occupied: 0, total: 0 };

  const eventApplicationCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach((app) => {
      if (!app.eventId) return;
      const status = (app.status || '').toString().toUpperCase();
      // Counter should reflect real number of registered exhibitors per event,
      // even if they are not assigned to a stand yet.
      if (status === AppStatus.DELETED) return;
      const key = normalizeId(app.eventId);
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [applications, normalizeId]);

  const avgOccupancy = React.useMemo(() => {
    const stats = Object.values(eventStats) as { occupied: number, total: number }[];
    if (stats.length === 0) return 0;
    const totals = stats.reduce((acc, s) => {
      if (s.total > 0) {
        acc.sum += (s.occupied / s.total) * 100;
        acc.count += 1;
      }
      return acc;
    }, { sum: 0, count: 0 });
    return totals.count > 0 ? Math.round(totals.sum / totals.count) : 0;
  }, [eventStats]);

  const totalRevenue = React.useMemo(() => {
    const parsePrice = (priceStr?: string) => {
      if (!priceStr) return 0;
      return parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
    };
    const sinceMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return applications.reduce((sum, app) => {
      const normalized = (app.status || '').toString().toUpperCase();
      if (normalized !== AppStatus.PAID) return sum;
      const submittedAtMs = app.submittedAt ? new Date(app.submittedAt).getTime() : 0;
      if (submittedAtMs && submittedAtMs < sinceMs) return sum;
      const prices = eventPrices[app.eventId] || {};
      const priceStr = app.zoneCategory ? prices[app.zoneCategory] : undefined;
      return sum + parsePrice(priceStr);
    }, 0);
  }, [applications, eventPrices]);

  // Combine all stats calculations into single pass for performance
  const { recentAppsCount, pendingCount, waitingPaymentCount, approvedBrandsCount, activeBrandsCount } = React.useMemo(() => {
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const approvedBrands = new Set<string>();
    const activeBrands = new Set<string>();

    const stats = applications.reduce(
      (acc, app) => {
        const normalized = (app.status || '').toString().toUpperCase();
        const submittedAtMs = app.submittedAt ? new Date(app.submittedAt).getTime() : 0;

        // Count recent apps (within 30 days)
        if (submittedAtMs && now - submittedAtMs < thirtyDaysMs) {
          acc.recentAppsCount++;
        }

        // Count pending
        if (normalized === AppStatus.PENDING) {
          acc.pendingCount++;
        }

        // Count waiting payment
        if ([
          AppStatus.APPROVED,
          AppStatus.PAYMENT_REMINDER,
          AppStatus.PAYMENT_LAST_CALL,
          AppStatus.PAYMENT_UNDER_REVIEW
        ].includes(normalized as AppStatus)) {
          acc.waitingPaymentCount++;
        }

        // Track approved brands
        if ([
          AppStatus.APPROVED,
          AppStatus.PAID,
          AppStatus.PAYMENT_REMINDER,
          AppStatus.PAYMENT_LAST_CALL
        ].includes(normalized as AppStatus)) {
          if (app.brandName) approvedBrands.add(app.brandName.toLowerCase());
        }

        // Track active brands (not deleted)
        if (normalized !== 'DELETED' && app.brandName) {
          activeBrands.add(app.brandName.toLowerCase());
        }

        return acc;
      },
      { recentAppsCount: 0, pendingCount: 0, waitingPaymentCount: 0 }
    );

    // Add brand counts from profile brands to activeBrands
    brands.forEach((profile) => {
      if (profile.brandName) activeBrands.add(profile.brandName.toLowerCase());
    });

    return {
      ...stats,
      approvedBrandsCount: approvedBrands.size,
      activeBrandsCount: activeBrands.size
    };
  }, [applications, brands]);

  const stats = [
    { label: 'Celkový obrat', value: formatCurrency(totalRevenue), trend: '+0%', icon: TrendingUp, color: 'text-green-600', period: 'POSLEDNÍCH 30 DNÍ' },
    { label: 'Aktivní přihlášky', value: applications.length.toString(), trend: `${recentAppsCount} nových`, icon: List, color: 'text-lavrs-red' },
    { label: 'Čeká na platbu', value: waitingPaymentCount.toString(), trend: 'Přihlášky čekající na platbu', icon: Users, color: 'text-blue-600' },
    { label: 'Počet značek', value: activeBrandsCount.toString(), trend: `Počet značek ${approvedBrandsCount} ♥`, icon: ShoppingBag, color: 'text-purple-600' }
  ];

  return (
    <div className="space-y-12">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-lavrs-dark">Operativní Hub</h2>
          <p className="text-gray-500">Vítej v mozkovém centru LAVRS.</p>
        </div>
        <button
          onClick={async () => {
            if (onCreateEvent) {
              await onCreateEvent();
              return;
            }
            if (onOpenEventsConfig) {
              onOpenEventsConfig();
              return;
            }
            onOpenCurator();
          }}
          className="hidden md:flex bg-lavrs-dark text-white px-8 py-4 rounded-none font-semibold hover:bg-lavrs-red transition-all items-center gap-2 shadow-lg active:scale-95"
        >
          <Plus size={20} /> Vytvořit nový event
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 md:p-8 rounded-none border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-3 md:mb-6">
              <div className={`p-2 md:p-3 bg-gray-50 rounded-none ${stat.color}`}>
                <stat.icon size={20} className="md:hidden" />
                <stat.icon size={24} className="hidden md:block" />
              </div>
              {stat.period && (
                <span className="text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 bg-gray-50 rounded-none text-gray-400">{stat.period}</span>
              )}
            </div>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h4 className="text-xl md:text-3xl font-extrabold tracking-tight text-lavrs-dark">{stat.value}</h4>
            <p className={`text-[10px] md:text-xs mt-1 md:mt-2 font-semibold ${stat.color}`}>{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Active Markets Table */}
        <div className="lg:col-span-2 bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 md:p-8 border-b border-gray-50">
            <h3 className="text-xl font-bold text-lavrs-dark">Přehled eventů LAVRS market</h3>
          </div>
          {/* Mobile card layout */}
          <div className="md:hidden divide-y divide-gray-50">
            {sortedEvents.map(event => {
              const occupiedFromLayout = getEventStat(event.id).occupied;
              const occupiedFromApplications = eventApplicationCounts[normalizeId(event.id)] || 0;
              const acceptedCount = Math.max(occupiedFromLayout, occupiedFromApplications);

              return (
                <div key={event.id} className="p-4 hover:bg-lavrs-beige/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-none overflow-hidden shadow-sm shrink-0">
                      <img src={event.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm text-lavrs-dark truncate">{event.title}</p>
                        <span className={`px-2 py-0.5 rounded-none text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                          event.status === 'open'
                            ? 'bg-green-100 text-green-700'
                            : event.status === 'draft'
                              ? 'bg-gray-100 text-gray-500'
                              : event.status === 'closed'
                                ? 'bg-red-100 text-red-700'
                                : event.status === 'soldout'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-pink-100 text-pink-700'
                        }`}>
                          {event.status === 'open' ? 'Otevřeno' : event.status === 'draft' ? 'Nezveřejněno' : event.status === 'closed' ? 'Zavřeno' : event.status === 'soldout' ? 'Vyprodáno' : 'Waitlist'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-medium mt-0.5">{formatEventDateRange(event.date, event?.endDate)} · {event.location}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-lavrs-red text-white font-black text-[9px] flex items-center justify-center shrink-0">
                            {acceptedCount}
                          </div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Vystavovatelů</p>
                        </div>
                        <button
                          onClick={() => onManageEvent ? onManageEvent(event.id) : onOpenCurator()}
                          className="text-lavrs-red text-[11px] font-bold hover:underline"
                        >
                          SPRAVOVAT
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table layout */}
          <div className="hidden md:block flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-4">Event / Datum / Lokace</th>
                  <th className="px-8 py-4">Kapacita</th>
                  <th className="px-8 py-4">Stav</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedEvents.map(event => {
                  const occupiedFromLayout = getEventStat(event.id).occupied;
                  const occupiedFromApplications = eventApplicationCounts[normalizeId(event.id)] || 0;
                  const acceptedCount = Math.max(occupiedFromLayout, occupiedFromApplications);

                  return (
                    <tr key={event.id} className="group hover:bg-lavrs-beige/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-none overflow-hidden shadow-sm shrink-0">
                            <img src={event.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-lavrs-dark">{event.title}</p>
                            <p className="text-xs text-gray-500 font-medium">{formatEventDateRange(event.date, event?.endDate)} · {event.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 aspect-square rounded-full bg-lavrs-red text-white font-black text-[10px] flex items-center justify-center shrink-0">
                            {acceptedCount}
                          </div>
                          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Vystavovatelů</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider ${
                          event.status === 'open'
                            ? 'bg-green-100 text-green-700'
                            : event.status === 'draft'
                              ? 'bg-gray-100 text-gray-500'
                              : event.status === 'closed'
                                ? 'bg-red-100 text-red-700'
                                : event.status === 'soldout'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-pink-100 text-pink-700'
                        }`}>
                          {event.status === 'open' ? 'Otevřeno' : event.status === 'draft' ? 'Nezveřejněno' : event.status === 'closed' ? 'Zavřeno' : event.status === 'soldout' ? 'Vyprodáno' : 'Waitlist'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => onManageEvent ? onManageEvent(event.id) : onOpenCurator()}
                          className="text-lavrs-red text-xs font-bold hover:underline"
                        >
                          SPRAVOVAT
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-8">
          <div className="bg-white rounded-none p-8 border border-gray-100 shadow-sm space-y-6">
            <h4 className="text-lg font-bold text-lavrs-dark">Nedávné aktivity</h4>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {activitiesLoading ? (
                <div className="py-8 text-center">
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Načítám...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Zatím žádná aktivita</p>
                </div>
              ) : (
                activities.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-lavrs-red text-white font-black text-[10px] flex items-center justify-center shrink-0 uppercase">
                      {activity.adminName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-lavrs-dark">
                        <span className="font-bold">{activity.adminName}</span>
                        {' '}{activity.description}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {activityDateFormatter.format(new Date(activity.createdAt))}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders when parent updates
const AdminDashboard = React.memo(AdminDashboardInner);

export default AdminDashboard;
