import React from 'react';
import { Settings, Plus, Edit, Trash2, Calendar, MapPin, Users } from 'lucide-react';
import { formatEventDate } from '../lib/mappers';
import { Application, MarketEvent } from '../types';

interface EventsConfigProps {
    onManageEvent?: (eventId: string) => void;
    events: MarketEvent[];
    applications: Application[];
    onDeleteEvent?: (eventId: string) => Promise<void>;
}

const EventsConfig: React.FC<EventsConfigProps> = ({ onManageEvent, events, applications, onDeleteEvent }) => {
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

    const eventApplicationCounts = React.useMemo(() => {
        const counts: Record<string, number> = {};
        applications.forEach(app => {
            if (app.status === 'DELETED') return;
            if (!app.eventId) return;
            counts[app.eventId] = (counts[app.eventId] || 0) + 1;
        });
        return counts;
    }, [applications]);

    const getEventOccupiedCount = (eventId: string) => eventApplicationCounts[eventId] || 0;

    const handleDeleteEvent = async (eventId: string) => {
        if (window.confirm('Opravdu chcete tento event vymazat? Tato akce je nevratná.')) {
            await onDeleteEvent?.(eventId);
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex items-end justify-between">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-lavrs-dark">Správa Eventů</h2>
                    <p className="text-gray-500">Vytváření a editace eventů LAVRS market.</p>
                </div>
                <button className="bg-lavrs-dark text-white px-8 py-4 rounded-none font-semibold hover:bg-lavrs-red transition-all flex items-center gap-2 shadow-lg active:scale-95">
                    <Plus size={20} /> Vytvořit nový event
                </button>
            </header>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedEvents.map((event) => (
                    <div key={event.id} className="bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all">
                        <div className="relative h-48 overflow-hidden">
                            <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-widest shadow-lg ${
                                event.status === 'open'
                                    ? 'bg-green-500 text-white'
                                    : event.status === 'draft'
                                        ? 'bg-gray-300 text-gray-700'
                                        : 'bg-blue-500 text-white'
                                }`}>
                                {event.status === 'open' ? 'Otevřeno' : event.status === 'draft' ? 'Nezveřejněno' : 'Waitlist'}
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-xl font-bold text-lavrs-dark mb-2">{event.title}</h3>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar size={14} className="text-lavrs-red" />
                                        <span>{formatEventDate(event.date)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin size={14} className="text-lavrs-red" />
                                        <span>{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Users size={14} className="text-lavrs-red" />
                                        <span>Přihlášeno: {getEventOccupiedCount(event.id)} / {event.capacity || '∞'}</span>
                                    </div>
                                    
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => onManageEvent && onManageEvent(event.id)}
                                    className="flex-1 py-3 bg-lavrs-dark text-white rounded-none font-bold hover:bg-lavrs-red transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit size={16} /> Spravovat
                                </button>
                                <button
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="px-4 py-3 bg-red-50 text-red-600 rounded-none font-bold hover:bg-red-100 transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EventsConfig;
