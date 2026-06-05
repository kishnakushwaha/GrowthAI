import React from 'react';
export function ContactDark({ title, email, phone }) {
  return (
    <div className="py-32 bg-zinc-950 text-white px-8">
      <div className="max-w-4xl mx-auto text-center border border-zinc-800 rounded-3xl p-16 bg-zinc-900/50">
        <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500 mb-8">{title}</h2>
        <p className="text-2xl text-zinc-400 mb-12">Let's build something extraordinary together.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-8 text-xl">
          <a href={`mailto:${email}`} className="hover:text-blue-400 transition-colors">{email}</a>
          <span className="hidden sm:inline text-zinc-700">|</span>
          <a href={`tel:${phone}`} className="hover:text-blue-400 transition-colors">{phone}</a>
        </div>
      </div>
    </div>
  );
}