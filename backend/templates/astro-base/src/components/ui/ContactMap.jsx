import React from 'react';
export function ContactMap({ title, address, email }) {
  return (
    <div className="relative h-screen bg-zinc-200">
      <div className="absolute inset-0 bg-zinc-300 flex items-center justify-center text-zinc-400 text-xl">[Interactive Map Integration Placeholder]</div>
      <div className="absolute bottom-12 left-12 bg-white p-10 rounded-2xl shadow-2xl max-w-sm z-10">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-zinc-600 mb-6">{address}</p>
        <a href={`mailto:${email}`} className="font-bold text-blue-600 hover:underline">{email}</a>
      </div>
    </div>
  );
}