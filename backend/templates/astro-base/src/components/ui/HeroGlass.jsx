import { motion } from 'framer-motion';

export function HeroGlass({ title, subtitle, cta, image }) {
  const bgImage = image || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80';
  return (
    <div className="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-zinc-950">
      {/* Background Image with Immersive Glow and Depth */}
      <div className="absolute inset-0 z-0 scale-105">
        <img src={bgImage} alt="" className="w-full h-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-zinc-950/70 to-zinc-950"></div>
        {/* Animated glowing orbs in the background */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px] animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-500/10 blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Floating Tag */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-8 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Premium Service
        </motion.div>

        {/* Title with Gradient Text & Text Shadow */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black text-white mb-8 tracking-tight leading-[1.1] drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] font-['Outfit']"
        >
          {title}
        </motion.h1>

        {/* Subtitle with better spacing */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-2xl text-zinc-300 max-w-3xl mx-auto mb-12 font-light leading-relaxed drop-shadow-sm font-['Plus_Jakarta_Sans']"
        >
          {subtitle}
        </motion.p>

        {/* Beautiful Glassmorphic CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
        >
          <a
            href="#contact"
            className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-105 transition-all duration-300 text-lg tracking-wide text-center"
          >
            {cta}
          </a>
          <a
            href="#services"
            className="w-full sm:w-auto px-10 py-5 bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 rounded-full font-semibold backdrop-blur-sm transition-all duration-300 text-lg text-center"
          >
            Explore Services
          </a>
        </motion.div>
      </div>

      {/* Modern bottom transition card overlay effect */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none"></div>
    </div>
  );
}