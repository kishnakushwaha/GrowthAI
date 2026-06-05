import React from 'react';
export function ServicesMinimal({ services }) {
  return (
    <div className="py-24 bg-black text-white px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-16">
        {services.map((s, i) => (
          <div key={i} className="border-t border-zinc-800 pt-8">
            <div className="text-4xl mb-6 opacity-50">0{i+1}</div>
            <h3 className="text-2xl font-medium mb-4">{s.title}</h3>
            <p className="text-zinc-400">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}