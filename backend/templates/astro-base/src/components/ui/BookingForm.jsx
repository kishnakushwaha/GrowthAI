import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const colorsMap = {
  'amber-500': {
    bg: 'bg-amber-500 text-black hover:bg-amber-600',
    text: 'text-amber-500',
    border: 'border-amber-500',
    borderFocus: 'focus:border-amber-500',
    bgLight: 'bg-amber-500/10',
    ring: 'focus:ring-amber-500/20 shadow-amber-500/10'
  },
  'purple-600': {
    bg: 'bg-purple-600 text-white hover:bg-purple-700',
    text: 'text-purple-600',
    border: 'border-purple-600',
    borderFocus: 'focus:border-purple-600',
    bgLight: 'bg-purple-600/10',
    ring: 'focus:ring-purple-600/20 shadow-purple-600/10'
  },
  'blue-600': {
    bg: 'bg-blue-600 text-white hover:bg-blue-700',
    text: 'text-blue-600',
    border: 'border-blue-600',
    borderFocus: 'focus:border-blue-600',
    bgLight: 'bg-blue-600/10',
    ring: 'focus:ring-blue-600/20 shadow-blue-600/10'
  },
  'rose-600': {
    bg: 'bg-rose-600 text-white hover:bg-rose-700',
    text: 'text-rose-600',
    border: 'border-rose-600',
    borderFocus: 'focus:border-rose-600',
    bgLight: 'bg-rose-600/10',
    ring: 'focus:ring-rose-600/20 shadow-rose-600/10'
  },
  'emerald-600': {
    bg: 'bg-emerald-600 text-white hover:bg-emerald-700',
    text: 'text-emerald-600',
    border: 'border-emerald-600',
    borderFocus: 'focus:border-emerald-600',
    bgLight: 'bg-emerald-600/10',
    ring: 'focus:ring-emerald-600/20 shadow-emerald-600/10'
  },
  'indigo-600': {
    bg: 'bg-indigo-600 text-white hover:bg-indigo-700',
    text: 'text-indigo-600',
    border: 'border-indigo-600',
    borderFocus: 'focus:border-indigo-600',
    bgLight: 'bg-indigo-600/10',
    ring: 'focus:ring-indigo-600/20 shadow-indigo-600/10'
  },
  'teal-600': {
    bg: 'bg-teal-600 text-white hover:bg-teal-700',
    text: 'text-teal-600',
    border: 'border-teal-600',
    borderFocus: 'focus:border-teal-600',
    bgLight: 'bg-teal-600/10',
    ring: 'focus:ring-teal-600/20 shadow-teal-600/10'
  },
  'orange-600': {
    bg: 'bg-orange-600 text-white hover:bg-orange-700',
    text: 'text-orange-600',
    border: 'border-orange-600',
    borderFocus: 'focus:border-orange-600',
    bgLight: 'bg-orange-600/10',
    ring: 'focus:ring-orange-600/20 shadow-orange-600/10'
  },
  'lime-500': {
    bg: 'bg-lime-500 text-black hover:bg-lime-600',
    text: 'text-lime-500',
    border: 'border-lime-500',
    borderFocus: 'focus:border-lime-500',
    bgLight: 'bg-lime-500/10',
    ring: 'focus:ring-lime-500/20 shadow-lime-500/10'
  },
  'pink-600': {
    bg: 'bg-pink-600 text-white hover:bg-pink-700',
    text: 'text-pink-600',
    border: 'border-pink-600',
    borderFocus: 'focus:border-pink-600',
    bgLight: 'bg-pink-600/10',
    ring: 'focus:ring-pink-600/20 shadow-pink-600/10'
  },
  'cyan-600': {
    bg: 'bg-cyan-600 text-white hover:bg-cyan-700',
    text: 'text-cyan-600',
    border: 'border-cyan-600',
    borderFocus: 'focus:border-cyan-600',
    bgLight: 'bg-cyan-600/10',
    ring: 'focus:ring-cyan-600/20 shadow-cyan-600/10'
  },
  'violet-600': {
    bg: 'bg-violet-600 text-white hover:bg-violet-700',
    text: 'text-violet-600',
    border: 'border-violet-600',
    borderFocus: 'focus:border-violet-600',
    bgLight: 'bg-violet-600/10',
    ring: 'focus:ring-violet-600/20 shadow-violet-600/10'
  },
};

const getColors = (color) => colorsMap[color] || colorsMap['teal-600'];

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM",
  "05:00 PM", "06:00 PM", "07:00 PM"
];

// Helper to generate the next 10 days starting from today
const getUpcomingDays = () => {
  const days = [];
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  for (let i = 0; i < 10; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push({
      dateStr: d.toLocaleDateString('en-US', options),
      rawDate: d.toISOString().split('T')[0]
    });
  }
  return days;
};

export function BookingForm({ services, primaryColor = 'teal-600', themeMode = 'light', businessPhone = '' }) {
  const c = getColors(primaryColor);
  const safeServices = Array.isArray(services) ? services : [];
  
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const upcomingDays = getUpcomingDays();

  const handleNextStep = () => {
    if (step === 1 && !selectedService) return;
    if (step === 2 && (!selectedDate || !selectedTime)) return;
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setBookingConfirmed(true);
    
    if (businessPhone) {
      const cleanBizPhone = businessPhone.replace(/[^0-9]/g, '');
      if (cleanBizPhone.length >= 10) {
        const dateFormatted = upcomingDays.find(d => d.rawDate === selectedDate)?.dateStr || selectedDate;
        const msg = `Hello, I'd like to book an appointment:\n\n*Service:* ${selectedService?.title}\n*Date:* ${dateFormatted}\n*Time:* ${selectedTime}\n*Name:* ${formData.name}\n*Email:* ${formData.email}\n*Notes:* ${formData.notes || 'None'}`;
        const whatsappUrl = `https://wa.me/${cleanBizPhone}?text=${encodeURIComponent(msg)}`;
        setTimeout(() => {
          window.open(whatsappUrl, '_blank');
        }, 1000);
      }
    }
  };

  // Theme-adaptive card styling
  const isDark = themeMode === 'dark';
  const cardBg = isDark
    ? 'bg-zinc-900/50 border-white/10 backdrop-blur-md'
    : 'bg-white border-gray-200 shadow-sm';
  const inputBg = isDark
    ? 'bg-zinc-900/60 border-white/10 text-white placeholder-zinc-500'
    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400';
  const labelColor = isDark ? 'text-zinc-300' : 'text-gray-700';
  const headingColor = isDark ? 'text-white' : 'text-gray-900';
  const subColor = isDark ? 'text-zinc-400' : 'text-gray-500';
  const stepLabel = isDark ? 'text-zinc-500' : 'text-gray-400';
  const cardItem = isDark
    ? 'border-white/5 bg-zinc-900/40 hover:border-white/10 hover:bg-zinc-900/60'
    : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white';
  const backBtn = isDark
    ? 'border border-white/10 text-white hover:bg-white/5'
    : 'border border-gray-200 text-gray-700 hover:bg-gray-50';
  const progressBg = isDark ? 'bg-white/5' : 'bg-gray-100';

  return (
    <div className={`w-full max-w-4xl mx-auto border rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden min-h-[500px] flex flex-col justify-between ${cardBg}`}>
      {/* Background glow styling */}
      <div className={`absolute top-0 right-0 w-80 h-80 rounded-full ${primaryColor === 'amber-500' ? 'bg-amber-500/5' : 'bg-' + primaryColor + '/5'} blur-3xl -z-10 pointer-events-none`}></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-white/5 blur-3xl -z-10 pointer-events-none"></div>

      <AnimatePresence mode="wait">
        {!bookingConfirmed ? (
          <div className="flex flex-col h-full justify-between gap-8">
            {/* Step Progress Header */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <span className={`text-xs font-semibold uppercase tracking-wider ${stepLabel}`}>Step {step} of 3</span>
                <span className={`text-sm font-medium ${c.text}`}>{step === 1 ? 'Select Service' : step === 2 ? 'Schedule Appointment' : 'Your Details'}</span>
              </div>
              
              <div className={`w-full h-1.5 rounded-full overflow-hidden mb-8 ${progressBg}`}>
                <motion.div 
                  className={`h-full ${c.bg.split(' ')[0]}`}
                  initial={{ width: '33.3%' }}
                  animate={{ width: `${step * 33.3}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Step Contents */}
            <div className="flex-1">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <div className="text-center md:text-left mb-6">
                    <h2 className={`text-2xl font-bold mb-2 ${headingColor}`}>What service are you looking for?</h2>
                    <p className={`text-sm ${subColor}`}>Please choose a service from the options below to get started.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {safeServices.map((service, index) => {
                      const isSelected = selectedService?.title === service.title;
                      return (
                        <div
                          key={index}
                          onClick={() => setSelectedService(service)}
                          className={`p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
                            isSelected 
                              ? `${c.border} ${isDark ? 'bg-white/5' : 'bg-' + primaryColor.split('-')[0] + '-50'}` 
                              : cardItem
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className={`text-lg font-semibold tracking-tight ${headingColor}`}>{service.title}</h3>
                              {isSelected && (
                                <div className={`w-5 h-5 rounded-full ${c.bg.split(' ')[0]} flex items-center justify-center`}>
                                  <svg className="w-3 h-3 text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className={`text-sm line-clamp-3 leading-relaxed mb-4 ${subColor}`}>{service.description}</p>
                          </div>
                          {service.price && (
                            <span className={`text-base font-bold ${c.text}`}>{service.price}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-8"
                >
                  <div className="text-center md:text-left">
                    <h2 className={`text-2xl font-bold mb-2 ${headingColor}`}>Choose Date & Time</h2>
                    <p className={`text-sm ${subColor}`}>Select a convenient day and time slot for your appointment.</p>
                  </div>

                  {/* Horizontal Date Picker */}
                  <div className="space-y-3">
                    <label className={`text-sm font-semibold ${labelColor}`}>Select Date</label>
                    <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/10 select-none">
                      {upcomingDays.map((day, i) => {
                        const isSelected = selectedDate === day.rawDate;
                        const [wday, mday] = day.dateStr.split(',');
                        return (
                          <div
                            key={i}
                            onClick={() => setSelectedDate(day.rawDate)}
                            className={`flex-shrink-0 w-24 py-4 rounded-xl border text-center cursor-pointer transition-all duration-300 flex flex-col justify-center gap-1 ${
                              isSelected
                                ? `${c.border} ${isDark ? 'bg-white/5' : c.bgLight}`
                                : isDark ? 'border-white/5 bg-zinc-900/40 hover:border-white/15' : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                            <span className={`text-xs uppercase font-bold ${stepLabel}`}>{wday}</span>
                            <span className={`text-xl font-bold ${headingColor}`}>{mday.trim()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grid Time Picker */}
                  <div className="space-y-3">
                    <label className={`text-sm font-semibold ${labelColor}`}>Available Slots</label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {timeSlots.map((slot, i) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedTime(slot)}
                            className={`py-3 px-2 rounded-xl text-sm font-medium border text-center transition-all duration-300 ${
                              isSelected
                                ? `${c.bg} ${c.border}`
                                : isDark ? 'border-white/5 bg-zinc-900/40 hover:border-white/15 text-zinc-300' : 'border-gray-200 bg-gray-50 hover:border-gray-300 text-gray-600'
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  <div className="text-center md:text-left mb-4">
                    <h2 className={`text-2xl font-bold mb-2 ${headingColor}`}>Provide Your Information</h2>
                    <p className={`text-sm ${subColor}`}>Please share your contact details to lock in your booking.</p>
                  </div>

                  <form id="details-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className={`text-sm font-medium ${labelColor}`}>Full Name</label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className={`w-full rounded-xl px-5 py-4 outline-none transition-all border ${inputBg} ${c.borderFocus} ${c.ring}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={`text-sm font-medium ${labelColor}`}>Email Address</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        className={`w-full rounded-xl px-5 py-4 outline-none transition-all border ${inputBg} ${c.borderFocus} ${c.ring}`}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className={`text-sm font-medium ${labelColor}`}>Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 000-0000"
                        className={`w-full rounded-xl px-5 py-4 outline-none transition-all border ${inputBg} ${c.borderFocus} ${c.ring}`}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className={`text-sm font-medium ${labelColor}`}>Special Instructions / Notes (Optional)</label>
                      <textarea
                        name="notes"
                        rows="3"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Any special requests or details we should know..."
                        className={`w-full rounded-xl px-5 py-4 outline-none transition-all resize-none border ${inputBg} ${c.borderFocus} ${c.ring}`}
                      />
                    </div>
                  </form>
                </motion.div>
              )}
            </div>

            {/* Step Controls Footer */}
            <div className={`flex justify-between items-center border-t pt-6 mt-8 ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${backBtn}`}
                >
                  Back
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  disabled={(step === 1 && !selectedService) || (step === 2 && (!selectedDate || !selectedTime))}
                  onClick={handleNextStep}
                  className={`px-8 py-3 rounded-xl font-bold transition-all ${
                    ((step === 1 && selectedService) || (step === 2 && selectedDate && selectedTime))
                      ? c.bg
                      : isDark ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  }`}
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  form="details-form"
                  className={`px-8 py-3 rounded-xl font-bold transition-all ${c.bg}`}
                >
                  Confirm Booking
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Confirmation State */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center py-12 px-4 gap-6"
          >
            <div className={`w-20 h-20 rounded-full ${c.bgLight} flex items-center justify-center border ${c.border} shadow-[0_0_30px_rgba(255,255,255,0.02)] mb-2`}>
              <svg className={`w-10 h-10 ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h2 className={`text-3xl font-extrabold tracking-tight ${headingColor}`}>Booking Requested!</h2>
              <p className={`text-sm max-w-md mx-auto ${subColor}`}>Thank you, {formData.name}. We've received your booking request and will follow up shortly to confirm details.</p>
            </div>

            {/* Summary Details */}
            <div className={`w-full max-w-md border rounded-2xl p-6 text-left space-y-4 ${isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-200'}`}>
              <h4 className={`font-bold border-b pb-2 text-sm uppercase tracking-wider ${isDark ? 'text-white border-white/5' : 'text-gray-900 border-gray-200'}`}>Booking Details</h4>
              <div className="grid grid-cols-3 gap-y-3 text-sm">
                <span className={subColor}>Service:</span>
                <span className={`col-span-2 font-semibold ${headingColor}`}>{selectedService?.title}</span>
                
                <span className={subColor}>Date:</span>
                <span className={`col-span-2 font-semibold ${headingColor}`}>
                  {upcomingDays.find(d => d.rawDate === selectedDate)?.dateStr || selectedDate}
                </span>
                
                <span className={subColor}>Time:</span>
                <span className={`col-span-2 font-semibold ${headingColor}`}>{selectedTime}</span>

                <span className={subColor}>Phone:</span>
                <span className={`col-span-2 font-semibold ${headingColor}`}>{formData.phone}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setSelectedService(null);
                setSelectedDate('');
                setSelectedTime('');
                setFormData({ name: '', email: '', phone: '', notes: '' });
                setBookingConfirmed(false);
              }}
              className="mt-4 px-6 py-3 rounded-xl border border-white/10 text-zinc-300 font-medium hover:text-white hover:bg-white/5 transition-all text-sm"
            >
              Book Another Session
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
