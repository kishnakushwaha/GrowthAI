import React from 'react';
export function HeroAbstract({ title, subtitle, cta }) {
  return (
    <div className="relative h-screen bg-indigo-900 text-white flex items-center px-12 overflow-hidden">
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="relative z-10 max-w-2xl">
        <h1 className="text-7xl font-extrabold mb-6 leading-tight">{title}</h1>
        <p className="text-2xl mb-10 opacity-90">{subtitle}</p>
        <button className="bg-white text-indigo-900 px-8 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl transition-shadow">{cta}</button>
      </div>
    </div>
  );
}