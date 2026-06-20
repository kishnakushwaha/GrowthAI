import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import AppointmentForm from '../components/AppointmentForm';
import { CLINIC_DETAILS } from '../constants';

const Contact = () => {
    return (
        <div className="bg-white">
            <div className="bg-primary/5 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <SectionHeader
                        title="Contact Us"
                        subtitle="Get In Touch"
                        className="mb-0"
                    />
                </div>
            </div>

            <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Contact Info */}
                    <div className="lg:w-1/2 space-y-8">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Clinic Information</h3>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Our Location</h4>
                                <p className="text-gray-600">{CLINIC_DETAILS.address}</p>
                                <a href={CLINIC_DETAILS.mapLink} target="_blank" rel="noreferrer" className="text-primary text-sm font-medium mt-2 inline-block hover:underline">
                                    Get Directions →
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Phone Number</h4>
                                <p className="text-gray-600">{CLINIC_DETAILS.phone}</p>
                                <a href={`tel:${CLINIC_DETAILS.phone.replace(/\s+/g, '')}`} className="text-primary text-sm font-medium mt-2 inline-block hover:underline">
                                    Call Now →
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Email Address</h4>
                                <p className="text-gray-600">{CLINIC_DETAILS.email}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 mb-1">Clinic Hours</h4>
                                <p className="text-gray-600">{CLINIC_DETAILS.hours} - 8:00 PM</p>
                                <p className="text-gray-500 text-sm">Monday - Sunday</p>
                            </div>
                        </div>

                        {/* Map Embed */}
                        <div className="mt-8 h-64 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                            <iframe
                                src="https://maps.google.com/maps?q=Dental%20Planet%20EROS%20SAMPOORNAM%2C%20Shop%20No%2014%2C%20Lower%20Ground%20Floor(LG%2C%20Sector%202%2C%20Patwari%2C%20Greater%20Noida%2C%20Uttar%20Pradesh%20201318&t=&z=13&ie=UTF8&iwloc=&output=embed"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                title="Clinic Location"
                            ></iframe>
                        </div>
                    </div>

                    {/* Appointment Form */}
                    <div className="lg:w-1/2">
                        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="bg-primary p-6 text-white text-center">
                                <h3 className="text-2xl font-bold">Book an Appointment</h3>
                                <p className="text-primary-100">Fill out the form below and we'll get back to you shortly.</p>
                            </div>
                            <div className="p-0">
                                <AppointmentForm className="shadow-none" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
