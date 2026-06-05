import React from 'react';
export function ContactBrutal({ title, email }) {
  return (
    <div className="py-24 bg-pink-500 px-8 flex flex-col items-center">
      <div className="bg-white border-4 border-black p-12 max-w-3xl w-full shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] text-center">
        <h2 className="text-6xl font-black uppercase mb-8">{title}</h2>
        <a href={`mailto:${email}`} className="block bg-black text-white text-3xl font-bold py-6 hover:bg-zinc-800 transition-colors">{email}</a>
      </div>
    </div>
  );
}