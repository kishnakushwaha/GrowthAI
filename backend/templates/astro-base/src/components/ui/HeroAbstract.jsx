import { motion } from 'framer-motion';

export function HeroAbstract({ title, subtitle, cta, image }) {
  return (
    <div className="relative min-h-[85vh] bg-zinc-950 text-white flex items-center px-10 md:px-16 overflow-hidden">
      {image && (
        <div className="absolute inset-0 z-0">
          <img src={image} alt="" className="w-full h-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent"></div>
        </div>
      )}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 md:w-96 h-80 md:h-96 bg-purple-600 rounded-full filter blur-[120px] opacity-30"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 md:w-96 h-80 md:h-96 bg-blue-600 rounded-full filter blur-[120px] opacity-30"></div>
      <div className="relative z-10 max-w-3xl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight break-words"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-xl md:text-2xl mb-10 text-zinc-300"
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
          className="inline-block bg-white text-zinc-900 px-8 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-shadow"
        >
          {cta}
        </motion.a>
      </div>
    </div>
  );
}