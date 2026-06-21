import { motion } from 'framer-motion';

export function HeroSplit({ title, subtitle, cta, image }) {
  const bgImage = image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80';
  return (
    <div className="flex flex-col md:flex-row min-h-[85vh] bg-zinc-950">
      <div className="flex-1 flex flex-col justify-center px-10 md:px-20 py-16 min-w-0">
        <motion.h1
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight break-words"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="text-lg md:text-xl text-zinc-400 mb-8 max-w-lg"
        >
          {subtitle}
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <a href="#contact" className="inline-block bg-white text-zinc-900 px-8 py-4 rounded-md font-bold text-lg hover:bg-zinc-200 transition-colors">{cta}</a>
        </motion.div>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <img src={bgImage} alt="Hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-transparent to-transparent"></div>
      </div>
    </div>
  );
}