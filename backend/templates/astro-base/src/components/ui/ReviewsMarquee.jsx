import React from 'react';
import { motion } from 'framer-motion';
export function ReviewsMarquee({ reviews }) {
  return (
    <div className="py-24 bg-white overflow-hidden flex flex-col items-center">
      <h2 className="text-4xl font-bold mb-16 text-center">What Our Clients Say</h2>
      <div className="flex space-x-6 animate-[marquee_20s_linear_infinite] whitespace-nowrap px-4">
        {reviews.concat(reviews).map((r, i) => (
          <div key={i} className="inline-block w-96 p-8 rounded-2xl bg-zinc-50 border border-zinc-100 shadow-sm whitespace-normal">
            <div className="flex text-yellow-400 mb-4">{"★".repeat(r.rating)}</div>
            <p className="text-zinc-700 text-lg mb-6 italic">"{r.text}"</p>
            <p className="font-semibold text-zinc-900">- {r.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}