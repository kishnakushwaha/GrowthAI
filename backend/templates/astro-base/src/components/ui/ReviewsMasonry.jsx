import React from 'react';
export function ReviewsMasonry({ reviews }) {
  return (
    <div className="py-24 bg-zinc-950 px-8">
      <h2 className="text-4xl font-bold mb-16 text-center text-white">Client Testimonials</h2>
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 max-w-7xl mx-auto">
        {reviews.map((r, i) => (
          <div key={i} className="break-inside-avoid p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
            <p className="text-zinc-300 text-lg mb-6">"{r.text}"</p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold">{r.author[0]}</div>
              <div>
                <p className="font-medium text-white">{r.author}</p>
                <div className="flex text-yellow-500 text-sm">{"★".repeat(r.rating)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}