import { motion } from 'framer-motion';

export function HeroVideoBackground({ title, subtitle, cta, image }) {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-black">
      {/* Background Media */}
      <motion.div 
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.6 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={image || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80"} 
          alt="Hero Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <motion.h1 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-tight mb-6"
        >
          {title}
        </motion.h1>
        <motion.p 
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="text-lg md:text-2xl text-gray-300 font-light max-w-3xl mx-auto mb-10"
        >
          {subtitle}
        </motion.p>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <a href="#contact" className="inline-block px-10 py-4 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform duration-300">
            {cta}
          </a>
        </motion.div>
      </div>

      {/* Floating decorative elements */}
      <motion.div 
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[1px] h-24 bg-gradient-to-b from-white/50 to-transparent"
      ></motion.div>
    </div>
  );
}
