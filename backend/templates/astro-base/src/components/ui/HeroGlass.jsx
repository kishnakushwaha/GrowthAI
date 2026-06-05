import React from 'react';
export function HeroGlass({ title, subtitle, cta }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative z-10 bg-white/10 p-12 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-md">{title}</h1>
        <p className="text-2xl text-neutral-200 mb-8 font-light">{subtitle}</p>
        <button className="bg-white/20 hover:bg-white/30 border border-white/50 text-white px-10 py-4 rounded-full backdrop-blur-sm transition-all text-lg font-semibold tracking-wide">{cta}</button>
      </div>
    </div>
  );
}