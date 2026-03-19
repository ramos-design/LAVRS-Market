
import React from 'react';
import { Mail } from 'lucide-react';

const Contact: React.FC = () => {
    return (
        <div className="space-y-12 max-w-4xl mx-auto">
            <header>
                <h2 className="text-4xl font-extrabold tracking-tight mb-2 text-lavrs-dark uppercase">Kontaktujte nás</h2>
                <p className="text-gray-500">Jsme tu pro vás. Máte-li jakékoli dotazy, neváhejte se na nás obrátit.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Contact Cards */}
                <div className="space-y-6">
                    <div className="bg-white p-8 border-2 border-lavrs-red/10 rounded-none shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-lavrs-beige flex items-center justify-center text-lavrs-red">
                                <Mail size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">E-mail</p>
                                <a href="mailto:info@lavrs.cz" className="text-xl font-bold text-lavrs-dark hover:text-lavrs-red transition-colors">info@lavrs.cz</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center animate-fadeIn">
                    <img 
                        src="/media/leopard.png" 
                        alt="LAVRS Mascot" 
                        className="w-full max-w-[320px] h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700" 
                    />
                </div>
            </div>
        </div>
    );
};

export default Contact;
