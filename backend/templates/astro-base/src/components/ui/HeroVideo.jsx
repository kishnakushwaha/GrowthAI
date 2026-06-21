import { motion } from 'framer-motion';

export function HeroVideo({ title, subtitle, cta, image }) {
  return (
    <div className="relative min-h-[85vh] flex items-center justify-center text-white text-center overflow-hidden bg-zinc-950">
      <div className="absolute inset-0">
        {image ? (
          <>
            <img src={image} alt="" className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
          </>
        ) : (
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-30">
            <source src="https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunny-day-26070-large.mp4" type="video/mp4" />
          </video>
        )}
      </div>
      <div className="relative z-10 p-8 max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight break-words"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-xl md:text-2xl font-light mb-8 text-zinc-300"
        >
          {subtitle}
        </motion.p>
        <motion.a
          href="#contact"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          className="inline-block bg-transparent border-2 border-white px-8 py-4 uppercase tracking-widest font-bold hover:bg-white hover:text-zinc-900 transition-colors"
        >
          {cta}
        </motion.a>
      </div>
    </div>
  );
}