import React from 'react';
export function ReviewsCards({ reviews }) {
  return (
    <div className="py-24 bg-zinc-100 px-8">
      <h2 className="text-center text-4xl font-black mb-16 text-zinc-900 uppercase tracking-widest">Reviews</h2>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {reviews.map((r, i) => (
          <div key={i} className="bg-white p-10 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
            <p className="text-2xl font-bold mb-4">"{r.text}"</p>
            <div className="flex justify-between items-end mt-8">
              <span className="font-bold text-xl">{r.author}</span>
              <span className="text-yellow-500 text-2xl">{"★".repeat(r.rating)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}