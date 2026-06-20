import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Star, ShieldCheck, Heart, Users, User } from 'lucide-react';
import Layout from '../components/Layout';
import Button from '../components/Button';
import SectionHeader from '../components/SectionHeader';
import AppointmentForm from '../components/AppointmentForm';
import { CLINIC_DETAILS } from '../constants';

const Home = () => {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-r from-primary/10 to-secondary/10 py-20 lg:py-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                        {/* Text Content */}
                        <div className="lg:w-1/2 text-center lg:text-left">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <span className="inline-block bg-white text-primary px-4 py-2 rounded-full text-sm font-semibold shadow-sm mb-6">
                                    Welcome to {CLINIC_DETAILS.name}
                                </span>
                                <h1 className="text-4xl lg:text-5xl font-bold font-heading text-gray-900 leading-tight mb-6">
                                    Your Trusted <span className="text-primary">Dental Care</span> Partner in Greater Noida
                                </h1>
                                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                                    Advanced, painless, and affordable dental treatments delivered with care. Experience world-class dentistry in a comfortable and modern environment.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <Button to="/contact" size="lg">
                                        Book Appointment
                                    </Button>
                                    <Button to="/services" variant="outline" size="lg">
                                        View Services
                                    </Button>
                                </div>

                                {/* Trust Badges - Mobile Optimized */}
                                <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-6 text-sm font-medium text-gray-700">
                                    <div className="flex items-center gap-2">
                                        <Star className="text-yellow-400 fill-yellow-400" size={20} />
                                        <span>5.0 Rating ({CLINIC_DETAILS.reviewCount}+ Reviews)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="text-primary" size={20} />
                                        <span>Women-Owned Clinic</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Hero Image/Form */}
                        <div className="lg:w-1/2 w-full">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="relative"
                            >
                                {/* Decorative blob */}
                                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl -z-10"></div>
                                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10"></div>

                                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-2 shadow-2xl border border-white/50">
                                    <img
                                        src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                                        alt="Modern Dental Clinic"
                                        className="rounded-2xl w-full h-auto object-cover max-h-[500px]"
                                    />
                                    {/* Floating badge */}
                                    <div className="absolute bottom-8 left-8 bg-white p-4 rounded-xl shadow-lg flex items-center gap-3 animate-bounce-slow">
                                        <div className="bg-green-100 p-2 rounded-full">
                                            <Users className="text-green-600" size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-semibold">Trusted By</p>
                                            <p className="text-lg font-bold text-gray-900">1000+ Patients</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeader
                        title="Why Choose Dental Planet?"
                        subtitle="Excellence in Dentistry"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: User, title: "Experienced Dentist", desc: "Expert care by Dr. Shivangi Attri & team." },
                            { icon: Heart, title: "Pain-Free Treatment", desc: "Advanced techniques for maximum comfort." },
                            { icon: ShieldCheck, title: "Modern Equipment", desc: "State-of-the-art technology for valid results." },
                            { icon: Star, title: "Affordable Pricing", desc: "Premium care at transparent, fair prices." },
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                whileHover={{ y: -10 }}
                                className="bg-gray-50 p-8 rounded-2xl text-center hover:bg-white hover:shadow-xl transition-all border border-gray-100"
                            >
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-6">
                                    <feature.icon size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Preview */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeader
                        title="Our Comprehensive Services"
                        subtitle="What We Offer"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Root Canal Treatment", desc: "Save your natural tooth with our painless RCT procedure." },
                            { title: "Cosmetic Dentistry", desc: "Transform your smile with veneers, bonding, and more." },
                            { title: "Teeth Whitening", desc: "Get a brighter, whiter smile in just one session." },
                            { title: "Dental Implants", desc: "Permanent solution for missing teeth that look natural." },
                            { title: "Orthodontics", desc: "Straighten your teeth with braces or clear aligners." },
                            { title: "General Dentistry", desc: "Routine checkups, cleanings, and fillings for oral health." },
                        ].map((service, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                                <CheckCircle2 className="text-secondary mb-4" size={32} />
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                                <p className="text-gray-600 mb-6">{service.desc}</p>
                                <Button to="/services" variant="ghost" size="sm" className="pl-0 hover:bg-transparent hover:text-secondary">
                                    Learn More →
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <Button to="/services" variant="secondary">
                            View All Treatments
                        </Button>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-primary/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <SectionHeader
                        title="Patient Reviews"
                        subtitle="Testimonials"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { name: "Rahul S.", text: "The procedure was quick and painless. My teeth feel so clean and fresh. Highly recommended!", rating: 5 },
                            { name: "Priya M.", text: "Handled with utmost professionalism. Dr. Shivangi is very gentle and explains everything clearly.", rating: 5 },
                            { name: "Amit K.", text: "Best dental clinic in Greater Noida. Clean, modern, and very affordable.", rating: 5 },
                        ].map((review, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative">
                                <div className="flex gap-1 mb-4">
                                    {[...Array(review.rating)].map((_, i) => (
                                        <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-gray-600 italic mb-6">"{review.text}"</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 font-bold">
                                        {review.name[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{review.name}</p>
                                        <p className="text-xs text-gray-500">Patient</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <a
                            href="https://www.google.com/search?q=Dental+Planet+Greater+Noida"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary font-semibold hover:underline"
                        >
                            <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-5 h-5" />
                            Read more reviews on Google
                        </a>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary text-white">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold font-heading mb-6">
                        Ready for a Healthy Smile?
                    </h2>
                    <p className="text-lg text-primary-100 mb-8">
                        Book your appointment today and experience the best dental care in Greater Noida.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button to="/contact" variant="white" size="lg">
                            Book Appointment Now
                        </Button>
                        <Button
                            href={`tel:${CLINIC_DETAILS.phone.replace(/\s+/g, '')}`}
                            variant="outline"
                            className="border-white text-white hover:bg-white/10"
                            size="lg"
                        >
                            Call {CLINIC_DETAILS.phone}
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
