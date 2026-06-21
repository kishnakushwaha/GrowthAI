import { motion } from 'framer-motion';

export function ReviewsGlass({ reviews }) {
  const safeReviews = Array.isArray(reviews) ? reviews.slice(0, 3) : [];
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      {safeReviews.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl text-white hover:bg-white/10 transition-colors duration-500"
        >
          <div className="flex text-yellow-400 mb-4 text-sm">{"★★★★★"}</div>
          <p className="text-base mb-6 font-light text-zinc-300 leading-relaxed break-words line-clamp-5">"{r.text}"</p>
          <div>
            <p className="font-bold text-white text-sm">{r.author}</p>
            {r.company && <p className="text-xs text-zinc-500 mt-1">{r.company}</p>}
          </div>
        </motion.div>
      ))}
    </div>
  );
}