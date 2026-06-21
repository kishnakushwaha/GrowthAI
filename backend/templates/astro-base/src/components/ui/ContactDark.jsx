import { motion } from 'framer-motion';

export function ContactDark({ title, email, phone, address }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full text-center border border-zinc-800 rounded-3xl p-12 md:p-16 bg-zinc-900/50 backdrop-blur-md"
    >
      <h2 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500 mb-4 break-words">{title || "Get In Touch"}</h2>
      <p className="text-xl text-zinc-400 mb-10">Let's build something extraordinary together.</p>
      <div className="flex flex-col sm:flex-row justify-center gap-6 text-lg flex-wrap">
        {phone && phone !== 'N/A' && (
          <a href={`tel:${phone}`} className="text-zinc-300 hover:text-white transition-colors break-all">{phone}</a>
        )}
        {phone && phone !== 'N/A' && email && email !== 'N/A' && (
          <span className="hidden sm:inline text-zinc-700">|</span>
        )}
        {email && email !== 'N/A' && (
          <a href={`mailto:${email}`} className="text-zinc-300 hover:text-white transition-colors break-all">{email}</a>
        )}
      </div>
      {address && address !== 'N/A' && (
        <p className="text-zinc-500 mt-6 text-sm break-words">{address}</p>
      )}
    </motion.div>
  );
}