import { motion } from 'framer-motion';

export function ServicesList({ services }) {
  const safeServices = Array.isArray(services) ? services : [];
  return (
    <div className="max-w-4xl mx-auto divide-y divide-white/5">
      {safeServices.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="py-8 group cursor-pointer hover:pl-4 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <h3 className="text-2xl md:text-3xl font-medium text-white group-hover:text-zinc-300 transition-colors min-w-0 break-words">{s.title}</h3>
          <p className="text-zinc-500 md:w-1/2 flex-shrink-0 text-sm leading-relaxed">{s.description}</p>
        </motion.div>
      ))}
    </div>
  );
}