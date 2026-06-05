import React from 'react';
export function ReviewsMinimal({ reviews }) {
  return (
    <div className="py-24 bg-white max-w-5xl mx-auto px-8 divide-y divide-zinc-200">
      <h2 className="text-3xl font-medium mb-12">Recent Feedback</h2>
      {reviews.map((r, i) => (
        <div key={i} className="py-8 flex flex-col md:flex-row gap-8">
          <div className="md:w-1/4">
            <p className="font-semibold text-zinc-900">{r.author}</p>
            <div className="flex text-zinc-400 text-sm mt-1">{"★".repeat(r.rating)}</div>
          </div>
          <div className="md:w-3/4">
            <p className="text-xl text-zinc-600 leading-relaxed">{r.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}