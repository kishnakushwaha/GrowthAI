import { motion } from 'framer-motion';

export function ReviewsCards({ reviews }) {
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
      {safeReviews.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="bg-zinc-900/80 p-8 rounded-2xl border border-white/5 backdrop-blur-md hover:border-white/10 transition-colors"
        >
          <div className="flex text-yellow-400 text-sm mb-4">{"★★★★★"}</div>
          <p className="text-zinc-300 text-base mb-6 leading-relaxed break-words">"{r.text}"</p>
          <div className="flex justify-between items-end">
            <div className="min-w-0 flex-1 mr-4">
              <span className="font-bold text-white text-sm truncate block">{r.author}</span>
              {r.company && <span className="text-xs text-zinc-500 truncate block">{r.company}</span>}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}