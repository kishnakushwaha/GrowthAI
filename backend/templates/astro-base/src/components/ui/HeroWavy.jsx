import { motion } from 'framer-motion';

export function HeroWavy({ title, subtitle, cta, image }) {
  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden bg-black text-white">
      {/* Background image layer */}
      {image && (
        <div className="absolute inset-0 z-0">
          <img src={image} alt="" className="w-full h-full object-cover opacity-20" />
        </div>
      )}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black z-[1]"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="z-10 text-center space-y-6 px-6 max-w-5xl mx-auto"
      >
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600 tracking-tight break-words">{title}</h1>
        <p className="text-xl md:text-2xl text-neutral-300 max-w-2xl mx-auto">{subtitle}</p>
        <motion.a
          href="#contact"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-block px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-zinc-100 transition-colors"
        >
          {cta}
        </motion.a>
      </motion.div>
    </div>
  );
}