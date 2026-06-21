import { motion } from 'framer-motion';

export function ServicesCards({ services }) {
  const safeServices = Array.isArray(services) ? services : [];
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      {safeServices.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="bg-zinc-900/80 p-10 rounded-2xl border border-white/5 backdrop-blur-md hover:border-white/10 hover:-translate-y-1 transition-all duration-500"
        >
          <div className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-xl mb-8 flex items-center justify-center text-lg">✦</div>
          <h3 className="text-xl font-bold mb-4 text-white">{s.title}</h3>
          <p className="text-zinc-400 leading-relaxed text-sm">{s.description}</p>
        </motion.div>
      ))}
    </div>
  );
}