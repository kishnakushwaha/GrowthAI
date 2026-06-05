import React from 'react';
export function HeroGrid({ title, subtitle, cta }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      <h1 className="text-5xl md:text-7xl font-bold z-10 text-center bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 mb-6">{title}</h1>
      <p className="text-xl text-neutral-400 z-10 text-center max-w-xl mb-8">{subtitle}</p>
      <button className="z-10 bg-white text-black px-8 py-3 rounded-md font-semibold">{cta}</button>
    </div>
  );
}