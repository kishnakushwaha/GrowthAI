import React from 'react';
export function HeroVideo({ title, subtitle, cta }) {
  return (
    <div className="relative min-h-[90vh] flex items-center justify-center text-white text-center">
      <div className="absolute inset-0 bg-zinc-900">
        <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-40"><source src="https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunny-day-26070-large.mp4" type="video/mp4" /></video>
      </div>
      <div className="relative z-10 p-8 max-w-3xl">
        <h1 className="text-6xl font-bold mb-4">{title}</h1>
        <p className="text-2xl font-light mb-8">{subtitle}</p>
        <button className="bg-transparent border-2 border-white px-8 py-4 uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-colors">{cta}</button>
      </div>
    </div>
  );
}