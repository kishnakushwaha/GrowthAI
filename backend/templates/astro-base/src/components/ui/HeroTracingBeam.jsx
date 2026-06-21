import { motion } from 'framer-motion';

export function HeroTracingBeam({ title, subtitle, cta, image }) {
  return (
    <div className="relative min-h-[85vh] flex items-center bg-zinc-950 text-white overflow-hidden">
      {/* Subtle background image */}
      {image && (
        <div className="absolute inset-0 z-0">
          <img src={image} alt="" className="w-full h-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent"></div>
        </div>
      )}
      {/* Accent beam */}
      <div className="absolute left-0 w-1 h-full bg-gradient-to-b from-blue-500 via-purple-500 to-transparent opacity-50 blur-[2px] z-[1]"></div>
      <div className="container mx-auto px-8 relative z-10 max-w-5xl">
        <motion.h1
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tight break-words"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-xl md:text-2xl text-zinc-400 mb-8 max-w-xl"
        >
          {subtitle}
        </motion.p>
        <motion.a
          href="#contact"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
        >
          {cta}
        </motion.a>
      </div>
    </div>
  );
}