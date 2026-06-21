import { motion } from 'framer-motion';

export function ContactBrutal({ title, email, phone, address }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotate: -1 }}
      whileInView={{ opacity: 1, rotate: 0 }}
      viewport={{ once: true }}
      className="w-full flex flex-col items-center"
    >
      <div className="bg-zinc-900 border-2 border-white/20 p-10 md:p-14 max-w-2xl w-full shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)] text-center rounded-sm">
        <h2 className="text-4xl md:text-5xl font-black uppercase mb-8 text-white break-words">{title || "Get In Touch"}</h2>
        <div className="space-y-4">
          {phone && phone !== 'N/A' && (
            <a href={`tel:${phone}`} className="block bg-white text-zinc-900 text-xl md:text-2xl font-bold py-5 hover:bg-zinc-200 transition-colors">{phone}</a>
          )}
          {email && email !== 'N/A' && (
            <a href={`mailto:${email}`} className="block border-2 border-white/20 text-white text-lg font-bold py-4 hover:bg-white/5 transition-colors break-all">{email}</a>
          )}
        </div>
      </div>
    </motion.div>
  );
}