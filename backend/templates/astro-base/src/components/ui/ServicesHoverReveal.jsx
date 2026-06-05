import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ServicesHoverReveal({ services }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <motion.div
            key={index}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative h-80 rounded-2xl overflow-hidden cursor-pointer group bg-stone-900 border border-white/5"
          >
            <div className="absolute inset-0 z-0">
              <img 
                src={service.image || `https://source.unsplash.com/random/800x800/?luxury,${encodeURIComponent(service.title)}`}
                alt={service.title}
                className="w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
            </div>

            <div className="absolute inset-0 z-10 p-8 flex flex-col justify-end">
              <h3 className="text-2xl font-bold text-white mb-2">{service.title}</h3>
              <AnimatePresence>
                {hoveredIndex === index && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-gray-300 text-sm overflow-hidden"
                  >
                    {service.description}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            
            {/* Animated accent line */}
            <div className="absolute bottom-0 left-0 h-1 bg-current w-0 group-hover:w-full transition-all duration-500 ease-out"></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
