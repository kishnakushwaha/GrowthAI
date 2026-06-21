import { motion } from 'framer-motion';

export function HeroMinimal({ title, subtitle, cta, image }) {
  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center bg-zinc-950 text-white px-6 overflow-hidden">
      {image && (
        <div className="absolute inset-0 z-0">
          <img src={image} alt="" className="w-full h-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-950/20 via-zinc-950/80 to-zinc-950"></div>
        </div>
      )}
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter text-center mb-8 break-words"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-xl md:text-2xl text-zinc-500 mb-12 text-center max-w-2xl mx-auto"
        >
          {subtitle}
        </motion.p>
        <motion.a
          href="#contact"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          className="inline-block px-8 py-3 border border-zinc-700 hover:border-white rounded-full transition-colors font-medium text-zinc-300 hover:text-white"
        >
          {cta}
        </motion.a>
      </div>
    </div>
  );
}