import React from 'react';
export function ReviewsGlass({ reviews }) {
  return (
    <div className="py-24 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80')] bg-cover bg-fixed px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {reviews.slice(0,3).map((r, i) => (
          <div key={i} className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl text-white">
            <div className="flex text-amber-300 mb-4">{"★".repeat(r.rating)}</div>
            <p className="text-xl mb-6 font-light">"{r.text}"</p>
            <p className="font-bold">{r.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}