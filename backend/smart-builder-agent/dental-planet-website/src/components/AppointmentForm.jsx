import React, { useState } from 'react';
import Button from './Button';
import { Calendar, Clock, User, Phone, MessageSquare } from 'lucide-react';

const AppointmentForm = ({ className }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        date: '',
        message: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Logic to handle form submission (e.g., send via WhatsApp or API)
        const text = `New Appointment Request:\nName: ${formData.name}\nPhone: ${formData.phone}\nDate: ${formData.date}\nMessage: ${formData.message}`;
        const whatsappUrl = `https://wa.me/917827399394?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
        alert('Redirecting to WhatsApp to complete your booking!');
    };

    return (
        <form onSubmit={handleSubmit} className={`bg-white rounded-2xl shadow-xl p-8 ${className}`}>
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center font-heading">
                Book Your <span className="text-secondary">Appointment</span>
            </h3>

            <div className="space-y-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <User size={18} />
                    </div>
                    <input
                        type="text"
                        name="name"
                        required
                        placeholder="Your Name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Phone size={18} />
                    </div>
                    <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                </div>

                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Calendar size={18} />
                    </div>
                    <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-gray-500"
                    />
                </div>

                <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                        <MessageSquare size={18} />
                    </div>
                    <textarea
                        name="message"
                        rows="3"
                        placeholder="Describe your problem (Optional)"
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none"
                    ></textarea>
                </div>

                <Button type="submit" fullWidth size="lg">
                    Book Now
                </Button>
            </div>
        </form>
    );
};

export default AppointmentForm;
