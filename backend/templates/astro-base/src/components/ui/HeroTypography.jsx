import React from 'react';
export function HeroTypography({ title, subtitle, cta }) {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col justify-center px-8 md:px-24">
      <h1 className="text-[10vw] font-serif leading-none tracking-tighter text-amber-950 uppercase">{title}</h1>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-12 gap-8">
        <p className="text-2xl md:text-4xl max-w-2xl text-amber-900/80 font-serif italic">{subtitle}</p>
        <button className="text-xl border-b-2 border-amber-950 text-amber-950 pb-1 hover:text-amber-700 hover:border-amber-700 transition-colors">{cta} -></button>
      </div>
    </div>
  );
}