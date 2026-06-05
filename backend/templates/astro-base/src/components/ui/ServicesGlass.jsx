import React from 'react';
export function ServicesGlass({ services }) {
  return (
    <div className="py-32 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80')] bg-cover bg-fixed relative">
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="max-w-6xl mx-auto relative z-10 px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((s, i) => (
          <div key={i} className="p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
            <h3 className="text-3xl font-bold text-white mb-4">{s.title}</h3>
            <p className="text-zinc-300 text-lg">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}