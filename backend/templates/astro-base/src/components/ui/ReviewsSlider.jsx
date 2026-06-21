import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function ReviewsSlider({ reviews }) {
  const safeReviews = Array.isArray(reviews) && reviews.length > 0 ? reviews : [];
  const [idx, setIdx] = useState(0);

  if (safeReviews.length === 0) return null;

  return (
    <div className="flex flex-col items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center relative min-h-[200px]">
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="flex text-yellow-400 justify-center mb-6">{"★★★★★"}</div>
            <p className="text-2xl md:text-4xl text-white font-serif leading-tight mb-8 break-words">"{safeReviews[idx]?.text}"</p>
            <p className="text-lg font-semibold text-zinc-400">{safeReviews[idx]?.author}</p>
            {safeReviews[idx]?.company && <p className="text-sm text-zinc-500 mt-1">{safeReviews[idx].company}</p>}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex gap-2 mt-8">
        {safeReviews.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} className={`h-2.5 rounded-full transition-all duration-300 ${i === idx ? 'bg-white w-8' : 'bg-zinc-700 w-2.5 hover:bg-zinc-500'}`}></button>
        ))}
      </div>
    </div>
  );
}