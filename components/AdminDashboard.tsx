
import React from 'react';
import { Plus, Users, ShoppingBag, LayoutGrid, List, MoreVertical, TrendingUp, Calendar } from 'lucide-react';
import { User } from '../types';
import { useEvents, useApplications, useBrandProfiles } from '../hooks/useSupabase';
import { dbEventToApp } from '../lib/mappers';
import { eventPlansDb } from '../lib/database';

interface AdminDashboardProps {
  user: User;
  onOpenCurator: () => void;
  onManageEvent?: (eventId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onOpenCurator, onManageEvent }) => {
  const { events: dbEvents } = useEvents();
  const { applications } = useApplications();
  const { profiles } = useBrandProfiles();

  const events = React.useMemo(() => dbEvents.map(dbEventToApp), [dbEvents]);
  const [occupancies, setOccupancies] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    // Load occupancies for all events
    const loadOccupancies = async () => {
      const result: Record<string, number> = {};
      for (const event of events) {
        try {
          const { plan, zones, stands } = await eventPlansDb.getByEventId(event.id);
          if (!plan || zones.length === 0) { result[event.id] = 0; continue; }
          let totalCapacity = 0;
          zones.forEach(z => {
            const caps = z.capacities as any;
            totalCapacity += ((caps.S || 0) + (caps.M || 0) + (caps.L || 0));
          });
          const occupied = stands.filter(s => s.occupant_id).length;
          result[event.id] = totalCapacity > 0 ? Math.round((occupied / totalCapacity) * 100) : 0;
        } catch { result[event.id] = 0; }
      }
      setOccupancies(result);
    };
    if (events.length > 0) loadOccupancies();
  }, [events]);

  const getEventOccupancy = (eventId: string) => occupancies[eventId] || 0;

  const avgOccupancy = React.useMemo(() => {
    const values = Object.values(occupancies);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((a: number, b: number) => a + b, 0) / values.length);
  }, [occupancies]);

  const recentAppsCount = applications.filter(a => {
    const d = new Date(a.submitted_at);
    return Date.now() - d.getTime() < 30 * 24 * 60 * 60 * 1000;
  }).length;

  const stats = [
    { label: 'Celkový obrat', value: '0 Kč', trend: '+0%', icon: TrendingUp, color: 'text-green-600' },
    { label: 'Aktivní přihlášky', value: applications.length.toString(), trend: `${recentAppsCount} nových`, icon: List, color: 'text-lavrs-red' },
    { label: 'Průměrná obsazenost', value: `${avgOccupancy}%`, trend: avgOccupancy >= 90 ? 'Vysoká' : 'V normě', icon: Users, color: 'text-blue-600' },
    { label: 'Aktivní značky', value: profiles.length.toString(), trend: 'Registrované v DB', icon: ShoppingBag, color: 'text-purple-600' }
  ];

  return (
    <div className="space-y-12">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-lavrs-dark">Operativní Hub</h2>
          <p className="text-gray-500">Vítej zpět v mozkovém centru LAVRS.</p>
        </div>
        <button className="bg-lavrs-dark text-white px-8 py-4 rounded-none font-semibold hover:bg-lavrs-red transition-all flex items-center gap-2 shadow-lg active:scale-95">
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
              <span className="text-[10px] font-bold px-2 py-1 bg-gray-50 rounded-none text-gray-400">POSLEDNÍCH 30 DNÍ</span>
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
                  const occupancy = getEventOccupancy(event.id);
                  return (
                    <tr key={event.id} className="group hover:bg-lavrs-beige/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-none overflow-hidden shadow-sm shrink-0">
                            <img src={event.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-sm text-lavrs-dark">{event.title}</p>
                            <p className="text-xs text-gray-500 font-medium">{event.date} · {event.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="w-32 h-2 bg-gray-100 rounded-none overflow-hidden">
                          <div
                            className={`h-full rounded-none ${occupancy >= 100 ? 'bg-gray-300' : 'bg-lavrs-red'}`}
                            style={{ width: `${occupancy}%` }}
                          />
                        </div>
                        <p className="text-[10px] font-bold mt-1 text-gray-400">{occupancy >= 100 ? 'FULL' : `${occupancy}% Obsazeno`}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-2.5 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider ${event.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                          {event.status === 'open' ? 'Otevřeno' : 'Waitlist'}
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