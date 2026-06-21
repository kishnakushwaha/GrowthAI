import { motion } from 'framer-motion';

export function ReviewsMasonry({ reviews }) {
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  return (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 max-w-7xl mx-auto">
      {safeReviews.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="break-inside-avoid p-8 rounded-2xl bg-zinc-900/80 border border-white/5 backdrop-blur-md"
        >
          <div className="flex text-yellow-400 text-sm mb-4">
            {"★★★★★"}
          </div>
          <p className="text-zinc-300 text-base mb-6 leading-relaxed break-words">"{r.text}"</p>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(r.author || '?')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-white text-sm truncate">{r.author}</p>
              {r.company && <p className="text-xs text-zinc-500 truncate">{r.company}</p>}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}