import { motion } from 'framer-motion';

export function ContactGlass({ title, email, phone, address }) {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden min-h-[500px] flex items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-900 to-zinc-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent"></div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative z-10 w-full max-w-xl bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-12 rounded-2xl shadow-2xl mx-4"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center tracking-tight break-words">{title || "Get In Touch"}</h2>
        {phone && phone !== 'N/A' && (
          <p className="text-center text-zinc-400 mb-8">
            Call us: <a href={`tel:${phone}`} className="text-white hover:underline">{phone}</a>
          </p>
        )}
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder="Name" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-zinc-500 outline-none focus:bg-white/10 focus:border-white/20 transition-all" />
          <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-zinc-500 outline-none focus:bg-white/10 focus:border-white/20 transition-all" />
          <textarea placeholder="Your message..." rows="3" className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-zinc-500 outline-none focus:bg-white/10 focus:border-white/20 transition-all resize-none"></textarea>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-white text-zinc-900 font-bold text-base py-4 rounded-xl hover:bg-zinc-200 transition-colors"
          >
            Send Message
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}