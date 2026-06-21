import { motion } from 'framer-motion';

export function ServicesBrutal({ services }) {
  const safeServices = Array.isArray(services) ? services : [];
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      {safeServices.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, rotate: -1 }}
          whileInView={{ opacity: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="bg-zinc-900 border-2 border-white/20 p-8 shadow-[6px_6px_0px_0px_rgba(255,255,255,0.1)] hover:-translate-y-1 hover:-translate-x-1 transition-transform"
        >
          <h3 className="text-2xl md:text-3xl font-black uppercase mb-4 text-white break-words">{s.title}</h3>
          <div className="h-0.5 w-full bg-white/20 mb-4"></div>
          <p className="text-zinc-400 text-base font-medium leading-relaxed">{s.description}</p>
        </motion.div>
      ))}
    </div>
  );
}