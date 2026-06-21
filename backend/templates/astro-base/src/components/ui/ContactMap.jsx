import { motion } from 'framer-motion';

export function ContactMap({ title, address, email, phone }) {
  const mapQuery = encodeURIComponent(address || '');
  return (
    <div className="relative w-full rounded-3xl overflow-hidden min-h-[450px] border border-white/10 bg-zinc-900">
      <div className="absolute inset-0 bg-zinc-800/50 flex items-center justify-center">
        {address && address !== 'N/A' ? (
          <iframe
            src={`https://maps.google.com/maps?q=${mapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
            className="w-full h-full border-0 opacity-60 grayscale"
            loading="lazy"
            title="Business Location"
          ></iframe>
        ) : (
          <div className="text-zinc-500 text-lg">Location Map</div>
        )}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="absolute bottom-6 left-6 right-6 sm:right-auto bg-zinc-950/90 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-sm z-10 border border-white/10"
      >
        <h2 className="text-2xl font-bold text-white mb-3 break-words">{title || "Visit Us"}</h2>
        {address && address !== 'N/A' && <p className="text-zinc-400 mb-4 text-sm break-words leading-relaxed">{address}</p>}
        <div className="space-y-2">
          {phone && phone !== 'N/A' && <a href={`tel:${phone}`} className="block font-medium text-white hover:underline text-sm">{phone}</a>}
          {email && email !== 'N/A' && <a href={`mailto:${email}`} className="block font-medium text-zinc-400 hover:text-white transition-colors text-sm break-all">{email}</a>}
        </div>
      </motion.div>
    </div>
  );
}