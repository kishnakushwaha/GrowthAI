import React from 'react';
import SectionHeader from '../components/SectionHeader';
import { CLINIC_DETAILS } from '../constants';
import { CheckCircle2 } from 'lucide-react';

const About = () => {
    return (
        <div className="bg-white">
            {/* Hero */}
            <div className="bg-primary/5 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <SectionHeader
                        title={`About ${CLINIC_DETAILS.name}`}
                        subtitle="Our Story"
                        className="mb-0"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-12 items-center">
                    {/* Image */}
                    <div className="lg:w-1/2">
                        <div className="relative">
                            <div className="absolute top-0 left-0 w-full h-full bg-primary rounded-2xl transform translate-x-4 translate-y-4 -z-10"></div>
                            <img
                                src="https://images.unsplash.com/photo-1559839734-2b71ea86b48e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                alt="Doctor"
                                className="rounded-2xl shadow-xl w-full"
                            />
                        </div>
                    </div>

                    {/* Text */}
                    <div className="lg:w-1/2">
                        <h3 className="text-3xl font-bold text-gray-900 mb-6">
                            Meet Dr. Shivangi Attri
                        </h3>
                        <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                            Dr. Shivangi Attri is distinctively qualified to provide comprehensive dental care for your entire family. With a focus on <span className="text-primary font-semibold">painless treatments</span> and <span className="text-primary font-semibold">modern dentistry</span>, she ensures every patient leaves with a confident smile.
                        </p>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            At Dental Planet, our mission is simple: to provide affordable, high-quality dental care in a comfortable and hygienic environment. We believe in building long-lasting relationships with our patients based on trust and transparency.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[
                                "Women-Owned Clinic",
                                "Patient-Centric Care",
                                "Advanced Technology",
                                "Strict Sterilization Protocols",
                                "Affordable Pricing",
                                "Friendly Environment"
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <CheckCircle2 className="text-secondary flex-shrink-0" size={20} />
                                    <span className="font-medium text-gray-800">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default About;
