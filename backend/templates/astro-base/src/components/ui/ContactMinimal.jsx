import React from 'react';
export function ContactMinimal({ title, email }) {
  return (
    <div className="py-32 bg-white text-center px-4">
      <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-8">{title}</h2>
      <a href={`mailto:${email}`} className="text-2xl md:text-4xl text-blue-600 hover:text-blue-800 transition-colors border-b-2 border-blue-200 hover:border-blue-800 pb-2">{email}</a>
    </div>
  );
}