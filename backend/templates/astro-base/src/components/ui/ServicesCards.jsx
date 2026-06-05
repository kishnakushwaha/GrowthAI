import React from 'react';
export function ServicesCards({ services }) {
  return (
    <div className="py-24 bg-zinc-50 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {services.map((s, i) => (
          <div key={i} className="bg-white p-10 rounded-2xl shadow-xl shadow-zinc-200/50 hover:-translate-y-2 transition-transform border border-zinc-100">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl mb-8 flex items-center justify-center">✦</div>
            <h3 className="text-2xl font-bold mb-4 text-zinc-900">{s.title}</h3>
            <p className="text-zinc-600 leading-relaxed">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}