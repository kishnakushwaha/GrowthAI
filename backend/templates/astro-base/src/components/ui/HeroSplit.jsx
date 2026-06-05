import React from 'react';
export function HeroSplit({ title, subtitle, cta }) {
  return (
    <div className="flex flex-col md:flex-row min-h-[90vh] bg-white dark:bg-zinc-900">
      <div className="flex-1 flex flex-col justify-center px-12 md:px-24">
        <h1 className="text-5xl md:text-7xl font-extrabold text-zinc-900 dark:text-white leading-tight mb-6">{title}</h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8">{subtitle}</p>
        <div><button className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-md font-bold text-lg hover:opacity-80 transition-opacity">{cta}</button></div>
      </div>
      <div className="flex-1 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
    </div>
  );
}