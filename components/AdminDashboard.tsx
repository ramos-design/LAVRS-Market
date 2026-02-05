
import React from 'react';
import { Plus, Users, ShoppingBag, LayoutGrid, List, MoreVertical, TrendingUp, Calendar } from 'lucide-react';
import { User } from '../types';
import { EVENTS } from '../constants';

interface AdminDashboardProps {
  user: User;
  onOpenCurator: () => void;
  onManageEvent?: (eventId: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onOpenCurator, onManageEvent }) => {
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
        {[
          { label: 'Celkový obrat', value: '4.82M Kč', trend: '+12%', icon: TrendingUp, color: 'text-green-600' },
          { label: 'Aktivní přihlášky', value: '156', trend: '42 nových', icon: List, color: 'text-lavrs-red' },
          { label: 'Průměrná obsazenost', value: '94%', trend: 'Maximalizováno', icon: Users, color: 'text-blue-600' },
          { label: 'Aktivní značky', value: '412', trend: '+14 v srpnu', icon: ShoppingBag, color: 'text-purple-600' }
        ].map((stat, i) => (
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
            <h3 className="text-xl font-bold text-lavrs-dark">Přehled eventů LAVRS MARKET</h3>
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
                {EVENTS.map(event => (
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
                          className={`h-full rounded-none ${event.status === 'open' ? 'bg-lavrs-red' : 'bg-gray-300'}`}
                          style={{ width: event.status === 'open' ? '85%' : '100%' }}
                        />
                      </div>
                      <p className="text-[10px] font-bold mt-1 text-gray-400">{event.status === 'open' ? '85% Obsazeno' : 'FULL'}</p>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="space-y-8">

          <div className="bg-white rounded-none p-8 border border-gray-100 shadow-sm space-y-6">
            <h4 className="text-lg font-bold text-lavrs-dark">Nedávné aktivity</h4>
            <div className="space-y-6">
              {[
                { user: 'Admin J.', action: 'Schválil značku Vintage Soul', time: '12m' },
                { user: 'Systém', action: 'Nová platba: 4.200 Kč', time: '1h' },
                { user: 'Admin K.', action: 'Změnil kapacitu Mini LAVRS', time: '3h' },
              ].map((activity, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-none bg-lavrs-pink flex items-center justify-center text-[10px] font-bold text-lavrs-red">
                    {activity.user[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-lavrs-dark">{activity.action}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">{activity.user} — {activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>

  );
};

export default AdminDashboard;