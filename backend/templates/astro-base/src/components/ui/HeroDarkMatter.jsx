import { motion } from 'framer-motion';

export function HeroDarkMatter({ title, subtitle, cta, image }) {
  return (
    <div className="relative min-h-[85vh] bg-zinc-950 flex flex-col justify-center items-center text-center p-8 overflow-hidden">
      {/* Subtle background image */}
      {image && (
        <div className="absolute inset-0 z-0">
          <img src={image} alt="" className="w-full h-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-950/20 via-zinc-950/70 to-zinc-950"></div>
        </div>
      )}
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block mb-6 px-4 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-400 text-sm"
        >
          Premium Service
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-600 mb-6 tracking-tight break-words"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-500 max-w-xl mx-auto mb-10"
        >
          {subtitle}
        </motion.p>
        <motion.a
          href="#contact"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="inline-block bg-zinc-100 text-zinc-900 px-8 py-3 rounded-md font-medium hover:bg-white transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
        >
          {cta}
        </motion.a>
      </div>
    </div>
  );
}