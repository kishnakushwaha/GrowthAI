import { motion } from 'framer-motion';

export function ReviewsMinimal({ reviews }) {
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  return (
    <div className="max-w-5xl mx-auto divide-y divide-white/5">
      {safeReviews.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="py-8 flex flex-col md:flex-row gap-6"
        >
          <div className="md:w-1/4 flex-shrink-0">
            <p className="font-semibold text-white text-sm">{r.author}</p>
            <div className="flex text-yellow-400 text-xs mt-1">{"★★★★★"}</div>
            {r.company && <p className="text-xs text-zinc-600 mt-1">{r.company}</p>}
          </div>
          <div className="md:w-3/4 min-w-0">
            <p className="text-base text-zinc-400 leading-relaxed break-words">"{r.text}"</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}