import { motion } from 'framer-motion';

export function ContactMinimal({ title, email, phone, address }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full text-center py-8"
    >
      <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-8 text-white break-words">{title || "Get In Touch"}</h2>
      <div className="space-y-3">
        {phone && phone !== 'N/A' && (
          <a href={`tel:${phone}`} className="block text-2xl md:text-3xl text-zinc-400 hover:text-white transition-colors">{phone}</a>
        )}
        {email && email !== 'N/A' && (
          <a href={`mailto:${email}`} className="block text-xl text-zinc-500 hover:text-white transition-colors break-all">{email}</a>
        )}
      </div>
    </motion.div>
  );
}