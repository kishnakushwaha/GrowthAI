import React from 'react';
import { MessageCircle } from 'lucide-react';
import { CLINIC_DETAILS } from '../constants';

const WhatsAppButton = () => {
    const handleClick = () => {
        const text = "Hi, I would like to book an appointment with Dental Planet.";
        const url = `https://wa.me/${CLINIC_DETAILS.phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 flex items-center justify-center group"
            aria-label="Chat on WhatsApp"
        >
            <MessageCircle size={32} />
            <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Chat with us
            </span>
        </button>
    );
};

export default WhatsAppButton;
