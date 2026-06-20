import React from 'react';
import SectionHeader from '../components/SectionHeader';

const Gallery = () => {
    const images = [
        { src: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Reception Area" },
        { src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Treatment Room" },
        { src: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Modern Equipment" },
        { src: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Sterilization Area" },
        { src: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Patient Consultation" },
        { src: "https://images.unsplash.com/photo-1516051662668-f3f1f3a1d18d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", alt: "Dental Chair" },
    ];

    return (
        <div className="bg-white">
            <div className="bg-primary/5 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <SectionHeader
                        title="Clinic Gallery"
                        subtitle="A Peek Inside"
                        className="mb-0"
                    />
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                        Take a tour of our modern, hygienic, and comfortable clinic environment designed for your smile.
                    </p>
                </div>
            </div>

            <div className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {images.map((img, idx) => (
                        <div key={idx} className="group relative overflow-hidden rounded-2xl shadow-md cursor-pointer aspect-w-4 aspect-h-3">
                            <img
                                src={img.src}
                                alt={img.alt}
                                className="object-cover w-full h-full transform group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <span className="text-white font-semibold text-lg">{img.alt}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Gallery;
