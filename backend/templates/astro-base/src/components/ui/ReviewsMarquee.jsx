import { motion } from 'framer-motion';

export function ReviewsMarquee({ reviews }) {
  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const duplicated = [...safeReviews, ...safeReviews];

  return (
    <div className="overflow-hidden">
      <div className="flex space-x-6 animate-[marquee_25s_linear_infinite] whitespace-nowrap px-4">
        {duplicated.map((r, i) => (
          <div key={i} className="inline-block w-80 md:w-96 p-8 rounded-2xl bg-zinc-900/80 border border-white/5 whitespace-normal flex-shrink-0">
            <div className="flex text-yellow-400 mb-4 text-sm">{"★★★★★"}</div>
            <p className="text-zinc-300 text-sm mb-6 italic leading-relaxed break-words line-clamp-4">"{r.text}"</p>
            <p className="font-semibold text-white text-sm">— {r.author}</p>
            {r.company && <p className="text-xs text-zinc-500 mt-1">{r.company}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}