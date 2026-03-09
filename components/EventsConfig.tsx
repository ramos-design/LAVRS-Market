import React from 'react';
import { Settings, Plus, Edit, Trash2, Calendar, MapPin, Users } from 'lucide-react';
import { useEvents } from '../hooks/useSupabase';
import { dbEventToApp } from '../lib/mappers';
import { eventPlansDb } from '../lib/database';

interface EventsConfigProps {
    onManageEvent?: (eventId: string) => void;
}

const EventsConfig: React.FC<EventsConfigProps> = ({ onManageEvent }) => {
    const { events: dbEvents } = useEvents();
    const events = React.useMemo(() => dbEvents.map(dbEventToApp), [dbEvents]);
    const [occupancies, setOccupancies] = React.useState<Record<string, number>>({});

    React.useEffect(() => {
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
                {events.map((event) => (
                    <div key={event.id} className="bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all">
                        <div className="relative h-48 overflow-hidden">
                            <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            <div className={`absolute top-4 right-4 px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-widest shadow-lg ${event.status === 'open' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                                }`}>
                                {event.status === 'open' ? 'Otevřeno' : 'Waitlist'}
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-xl font-bold text-lavrs-dark mb-2">{event.title}</h3>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Calendar size={14} className="text-lavrs-red" />
                                        <span>{event.date}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <MapPin size={14} className="text-lavrs-red" />
                                        <span>{event.location}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Users size={14} className="text-lavrs-red" />
                                        <span>Obsazenost: {getEventOccupancy(event.id)}%</span>
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
                                <button className="px-4 py-3 bg-red-50 text-red-600 rounded-none font-bold hover:bg-red-100 transition-all">
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
