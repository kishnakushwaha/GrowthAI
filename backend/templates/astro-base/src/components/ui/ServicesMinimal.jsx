import { motion } from 'framer-motion';

export function ServicesMinimal({ services }) {
  const safeServices = Array.isArray(services) ? services : [];
  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-12">
      {safeServices.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="border-t border-white/10 pt-8"
        >
          <div className="text-3xl mb-4 text-zinc-600 font-mono">0{i+1}</div>
          <h3 className="text-xl font-medium mb-3 text-white">{s.title}</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">{s.description}</p>
        </motion.div>
      ))}
    </div>
  );
}