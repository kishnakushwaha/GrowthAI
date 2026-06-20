import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Twitter } from 'lucide-react';
import { CLINIC_DETAILS, NAV_LINKS } from '../constants';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-white pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

                    {/* Brand & About */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold font-heading text-white">
                            {CLINIC_DETAILS.name}
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Your trusted dental care partner in Greater Noida. We provide advanced, painless, and affordable dental treatments in a modern and comfortable environment.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-primary transition-colors text-white">
                                <Facebook size={18} />
                            </a>
                            <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-primary transition-colors text-white">
                                <Instagram size={18} />
                            </a>
                            <a href="#" className="bg-gray-800 p-2 rounded-full hover:bg-primary transition-colors text-white">
                                <Twitter size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-white border-b border-gray-700 pb-2 inline-block">
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            {NAV_LINKS.map((link) => (
                                <li key={link.name}>
                                    <Link
                                        to={link.path}
                                        className="text-gray-400 hover:text-primary transition-colors hover:translate-x-1 inline-block"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Services */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-white border-b border-gray-700 pb-2 inline-block">
                            Our Services
                        </h3>
                        <ul className="space-y-3">
                            <li><Link to="/services" className="text-gray-400 hover:text-primary transition-colors">Root Canal Treatment</Link></li>
                            <li><Link to="/services" className="text-gray-400 hover:text-primary transition-colors">Teeth Whitening</Link></li>
                            <li><Link to="/services" className="text-gray-400 hover:text-primary transition-colors">Cosmetic Dentistry</Link></li>
                            <li><Link to="/services" className="text-gray-400 hover:text-primary transition-colors">Dental Implants</Link></li>
                            <li><Link to="/services" className="text-gray-400 hover:text-primary transition-colors">Orthodontics</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-lg font-semibold mb-6 text-white border-b border-gray-700 pb-2 inline-block">
                            Get in Touch
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-gray-400">
                                <MapPin size={20} className="text-primary mt-1 flex-shrink-0" />
                                <a
                                    href={CLINIC_DETAILS.mapLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-white transition-colors"
                                >
                                    {CLINIC_DETAILS.address}
                                </a>
                            </li>
                            <li className="flex items-center gap-3 text-gray-400">
                                <Phone size={20} className="text-primary flex-shrink-0" />
                                <a href={`tel:${CLINIC_DETAILS.phone.replace(/\s+/g, '')}`} className="hover:text-white transition-colors">
                                    {CLINIC_DETAILS.phone}
                                </a>
                            </li>
                            <li className="flex items-center gap-3 text-gray-400">
                                <Mail size={20} className="text-primary flex-shrink-0" />
                                <a href={`mailto:${CLINIC_DETAILS.email}`} className="hover:text-white transition-colors">
                                    {CLINIC_DETAILS.email}
                                </a>
                            </li>
                            <li className="flex items-center gap-3 text-gray-400">
                                <Clock size={20} className="text-primary flex-shrink-0" />
                                <span>{CLINIC_DETAILS.hours}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-8 mt-8 text-center md:flex md:justify-between md:text-left">
                    <p className="text-gray-500 text-sm">
                        &copy; {currentYear} {CLINIC_DETAILS.name}. All rights reserved.
                    </p>
                    <p className="text-gray-600 text-sm mt-2 md:mt-0">
                        Designed for Excellence
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
