import React from 'react';
import SectionHeader from '../components/SectionHeader';
import Button from '../components/Button';
import { CheckCircle2, ShieldCheck, HeartPulse, Sparkles, Smile, Layers } from 'lucide-react';

const Services = () => {
    const services = [
        {
            id: "scaling",
            title: "Dental Scaling & Cleaning",
            desc: "Remove plaque and tartar to prevent gum disease and bad breath.",
            benefits: ["Prevents gum disease", "Freshens breath", "Removes stains"],
            icon: Layers
        },
        {
            id: "rct",
            title: "Root Canal Treatment",
            desc: "Save your infected tooth with our painless and advanced root canal therapy.",
            benefits: ["Saves natural tooth", "Relieves pain", "Prevents infection spread"],
            icon: HeartPulse
        },
        {
            id: "filling",
            title: "Tooth Filling",
            desc: "Restore decayed teeth with tooth-colored composite fillings.",
            benefits: ["Natural appearance", "Restores function", "Prevents further decay"],
            icon: ShieldCheck
        },
        {
            id: "extraction",
            title: "Tooth Extraction",
            desc: "Safe and painless removal of damaged or wisdom teeth.",
            benefits: ["Relieves severe pain", "Prevents overcrowding", "Removes infection"],
            icon: Layers // Using Layers as placeholder
        },
        {
            id: "cosmetic",
            title: "Cosmetic Dentistry",
            desc: "Enhance your smile with veneers, bonding, and smile makeovers.",
            benefits: ["Boosts confidence", "Corrects imperfections", "Long-lasting results"],
            icon: Sparkles
        },
        {
            id: "whitening",
            title: "Teeth Whitening",
            desc: "Professional whitening for a brighter, more confident smile.",
            benefits: ["Instant results", "Safe procedure", "Removes deep stains"],
            icon: Smile
        },
    ];

    return (
        <div className="bg-white">
            {/* Page Header */}
            <div className="bg-primary/5 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <SectionHeader
                        title="Our Dental Services"
                        subtitle="Comprehensive Care"
                        className="mb-0"
                    />
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                        From routine checkups to advanced cosmetic procedures, we offer a full range of dental treatments to keep your smile healthy and beautiful.
                    </p>
                </div>
            </div>

            {/* Services Grid */}
            <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {services.map((service, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all group">
                            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                                <service.icon size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                            <p className="text-gray-600 mb-6">{service.desc}</p>

                            <ul className="space-y-2 mb-8">
                                {service.benefits.map((benefit, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                        <CheckCircle2 size={16} className="text-secondary mt-0.5" />
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button to="/contact" variant="outline" fullWidth size="sm">
                                Book Consultation
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* CTA */}
            <div className="bg-secondary/10 py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Not sure what you need?</h2>
                    <p className="text-gray-600 mb-8">
                        Schedule a consultation with Dr. Shivangi Attri to discuss your dental health goals.
                    </p>
                    <Button to="/contact">
                        Get Expert Advice
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Services;
