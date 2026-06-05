import React from 'react';
export function HeroMinimal({ title, subtitle, cta }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] text-zinc-900 px-6">
      <h1 className="text-6xl md:text-8xl font-medium tracking-tighter text-center mb-8 max-w-5xl">{title}</h1>
      <p className="text-2xl text-zinc-500 mb-12 text-center max-w-2xl">{subtitle}</p>
      <button className="px-6 py-3 border border-zinc-200 hover:border-zinc-900 rounded-full transition-colors font-medium">{cta}</button>
    </div>
  );
}