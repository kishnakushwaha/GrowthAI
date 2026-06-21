import { motion } from 'framer-motion';

export function HeroTypography({ title, subtitle, cta, image }) {
  return (
    <div className="relative min-h-[85vh] bg-zinc-950 flex flex-col justify-center px-8 md:px-24 overflow-hidden">
      {image && (
        <div className="absolute inset-0 z-0">
          <img src={image} alt="" className="w-full h-full object-cover opacity-5" />
        </div>
      )}
      <div className="relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10vw] md:text-[8vw] font-serif leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500 uppercase break-words"
        >
          {title}
        </motion.h1>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-10 gap-8">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-xl md:text-3xl max-w-2xl text-zinc-400 font-serif italic"
          >
            {subtitle}
          </motion.p>
          <motion.a
            href="#contact"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg border-b-2 border-zinc-400 text-zinc-300 pb-1 hover:text-white hover:border-white transition-colors whitespace-nowrap"
          >
            {cta} →
          </motion.a>
        </div>
      </div>
    </div>
  );
}