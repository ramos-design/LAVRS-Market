
import React from 'react';
import { Plus, Users, ShoppingBag, LayoutGrid, List, MoreVertical, TrendingUp, Calendar } from 'lucide-react';
import { AppStatus, User } from '../types';
import { useEvents, useApplications, useBrandProfiles } from '../hooks/useSupabase';
import { dbEventToApp, formatEventDate } from '../lib/mappers';
import { eventPlansDb } from '../lib/database';

interface AdminDashboardProps {
  user: User;
  onOpenCurator: () => void;
  onManageEvent?: (eventId: string) => void;
  onOpenEventsConfig?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onOpenCurator, onManageEvent, onOpenEventsConfig }) => {
  const { events: dbEvents } = useEvents();
  const { applications } = useApplications();
  const { profiles } = useBrandProfiles();

  const events = React.useMemo(() => {
    const parsed = dbEvents.map(dbEventToApp);
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
  }, [dbEvents]);
  const [eventStats, setEventStats] = React.useState<Record<string, { occupied: number, total: number }>>({});
  const [eventPrices, setEventPrices] = React.useState<Record<string, Record<string, string>>>({});

  React.useEffect(() => {
    // Load occupancies for all events
    const loadOccupancies = async () => {
      const result: Record<string, { occupied: number, total: number }> = {};
      const priceResult: Record<string, Record<string, string>> = {};
      for (const event of events) {
        try {
          const { plan, zones, stands } = await eventPlansDb.getByEventId(event.id);
          if (!plan) { 
            result[event.id] = { occupied: 0, total: 0 }; 
            priceResult[event.id] = {};
            continue; 
          }
          priceResult[event.id] = (plan.prices as Record<string, string>) || {};
          if (zones.length === 0) {
            result[event.id] = { occupied: 0, total: 0 };
            continue;
          }
          let totalCapacity = 0;
          zones.forEach(z => {
            const caps = z.capacities as any;
            totalCapacity += ((caps.S || 0) + (caps.M || 0) + (caps.L || 0));
          });
          const occupied = stands.filter(s => s.occupant_id).length;
          result[event.id] = { occupied, total: totalCapacity };
        } catch { 
          result[event.id] = { occupied: 0, total: 0 }; 
          priceResult[event.id] = {};
        }
      }
      setEventStats(result);
      setEventPrices(priceResult);
    };
    if (events.length > 0) loadOccupancies();
  }, [events]);

  const getEventStat = (eventId: string) => eventStats[eventId] || { occupied: 0, total: 0 };

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

  const formatCurrency = (num: number) => new Intl.NumberFormat('cs-CZ').format(num) + ' Kč';

  const totalRevenue = React.useMemo(() => {
    const parsePrice = (priceStr?: string) => {
      if (!priceStr) return 0;
      return parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
    };
    const sinceMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return applications.reduce((sum, app) => {
      const normalized = (app.status || '').toString().toUpperCase();
      if (normalized !== AppStatus.PAID) return sum;
      const submittedAtMs = app.submitted_at ? new Date(app.submitted_at).getTime() : 0;
      if (submittedAtMs && submittedAtMs < sinceMs) return sum;
      const prices = eventPrices[app.event_id] || {};
      const priceStr = app.zone_category ? prices[app.zone_category] : undefined;
      return sum + parsePrice(priceStr);
    }, 0);
  }, [applications, eventPrices]);

  const recentAppsCount = applications.filter(a => {
    const d = new Date(a.submitted_at);
    return Date.now() - d.getTime() < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const pendingCount = applications.filter(a => (a.status || '').toString().toUpperCase() === AppStatus.PENDING).length;
  const waitingPaymentCount = applications.filter(a => {
    const normalized = (a.status || '').toString().toUpperCase();
    return [
      AppStatus.APPROVED,
      AppStatus.PAYMENT_REMINDER,
      AppStatus.PAYMENT_LAST_CALL,
      AppStatus.PAYMENT_UNDER_REVIEW
    ].includes(normalized as AppStatus);
  }).length;

  const approvedBrandsCount = React.useMemo(() => {
    const names = new Set<string>();
    applications.forEach((app) => {
      const normalized = (app.status || '').toString().toUpperCase();
      const isApproved =
        normalized === AppStatus.APPROVED ||
        normalized === AppStatus.PAID ||
        normalized === AppStatus.PAYMENT_REMINDER ||
        normalized === AppStatus.PAYMENT_LAST_CALL;
      if (!isApproved) return;
      if (app.brand_name) names.add(app.brand_name.toLowerCase());
    });
    return names.size;
  }, [applications]);

  const activeBrandsCount = React.useMemo(() => {
    const names = new Set<string>();
    applications.forEach((app) => {
      if (app.status === 'DELETED') return;
      if (app.brand_name) names.add(app.brand_name.toLowerCase());
    });
    profiles.forEach((profile) => {
      if (profile.brand_name) names.add(profile.brand_name.toLowerCase());
    });
    return names.size;
  }, [applications, profiles]);

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
          <p className="text-gray-500">Vítej zpět v mozkovém centru LAVRS.</p>
        </div>
        <button
          onClick={() => (onOpenEventsConfig ? onOpenEventsConfig() : onOpenCurator())}
          className="bg-lavrs-dark text-white px-8 py-4 rounded-none font-semibold hover:bg-lavrs-red transition-all flex items-center gap-2 shadow-lg active:scale-95"
        >
          <Plus size={20} /> Vytvořit nový event
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-none border border-gray-100 shadow-sm transition-all hover:shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 bg-gray-50 rounded-none ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              {stat.period && (
                <span className="text-[10px] font-bold px-2 py-1 bg-gray-50 rounded-none text-gray-400">{stat.period}</span>
              )}
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <h4 className="text-3xl font-extrabold tracking-tight text-lavrs-dark">{stat.value}</h4>
            <p className={`text-xs mt-2 font-semibold ${stat.color}`}>{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Active Markets Table */}
        <div className="lg:col-span-2 bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xl font-bold text-lavrs-dark">Přehled eventů LAVRS market</h3>
            <div className="flex gap-2 p-1 bg-gray-50 rounded-none">
              <button className="p-2 bg-white rounded-none shadow-sm"><LayoutGrid size={16} /></button>
              <button className="p-2 text-gray-400"><List size={16} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto">
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
                {events.map(event => {
                  const { total: layoutTotal } = getEventStat(event.id);
                  const acceptedCount = getEventStat(event.id).occupied;
                  
                  return (
                    <tr key={event.id} className="group hover:bg-lavrs-beige/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-none overflow-hidden shadow-sm shrink-0">
                            <img src={event.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-lavrs-dark">{event.title}</p>
                            <p className="text-xs text-gray-500 font-medium">{formatEventDate(event.date)} · {event.location}</p>
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
                              : 'bg-amber-100 text-amber-700'
                        }`}>
                          {event.status === 'open' ? 'Otevřeno' : event.status === 'draft' ? 'Nezveřejněno' : 'Waitlist'}
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
            {/* Real activities would be fetched from a logs/audit table - showing placeholder for now */}
            <div className="space-y-6">
              <div className="py-12 text-center">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Zatím žádná aktivita</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
