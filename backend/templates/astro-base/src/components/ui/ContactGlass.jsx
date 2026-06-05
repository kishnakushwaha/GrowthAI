import React from 'react';
export function ContactGlass({ title, email, phone }) {
  return (
    <div className="py-32 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80')] bg-cover relative flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative z-10 w-full max-w-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-12 rounded-3xl shadow-2xl">
        <h2 className="text-4xl font-bold text-white mb-8 text-center">{title}</h2>
        <form className="space-y-6">
          <input type="text" placeholder="Name" className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white placeholder-white/50 outline-none focus:bg-white/10 transition-colors" />
          <input type="email" placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white placeholder-white/50 outline-none focus:bg-white/10 transition-colors" />
          <button className="w-full bg-white text-black font-bold text-lg py-4 rounded-xl hover:bg-zinc-200 transition-colors">Send Message</button>
        </form>
      </div>
    </div>
  );
}