import React from 'react';
export function HeroDarkMatter({ title, subtitle, cta }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center text-center p-8">
      <div className="inline-block mb-4 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-400 text-sm">New Release</div>
      <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-600 mb-6 tracking-tight">{title}</h1>
      <p className="text-xl text-zinc-500 max-w-xl mb-10">{subtitle}</p>
      <button className="bg-zinc-100 text-zinc-900 px-8 py-3 rounded-md font-medium hover:bg-white transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]">{cta}</button>
    </div>
  );
}