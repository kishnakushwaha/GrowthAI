import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
export function ReviewsSlider({ reviews }) {
  const [idx, setIdx] = useState(0);
  return (
    <div className="py-32 bg-blue-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center relative h-64">
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute inset-0">
            <p className="text-3xl md:text-5xl text-blue-900 font-serif leading-tight mb-8">"{reviews[idx]?.text}"</p>
            <p className="text-lg font-semibold text-blue-800">{reviews[idx]?.author}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex gap-2 mt-8">
        {reviews.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} className={`w-3 h-3 rounded-full transition-all ${i === idx ? 'bg-blue-600 w-8' : 'bg-blue-300'}`}></button>
        ))}
      </div>
    </div>
  );
}