import React from 'react';
export function ContactSplit({ title, email, phone }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-50">
      <div className="flex-1 p-12 md:p-24 bg-black text-white flex flex-col justify-center">
        <h2 className="text-5xl md:text-7xl font-bold mb-8">{title}</h2>
        <p className="text-2xl mb-4 text-zinc-400">E: {email}</p>
        <p className="text-2xl text-zinc-400">T: {phone}</p>
      </div>
      <div className="flex-1 p-12 md:p-24 flex flex-col justify-center bg-white">
        <form className="space-y-8 max-w-xl">
          <input type="text" placeholder="Your Name" className="w-full text-2xl border-b-2 border-zinc-200 py-4 outline-none focus:border-black transition-colors" />
          <input type="email" placeholder="Email Address" className="w-full text-2xl border-b-2 border-zinc-200 py-4 outline-none focus:border-black transition-colors" />
          <textarea placeholder="Tell us about your project" rows="4" className="w-full text-2xl border-b-2 border-zinc-200 py-4 outline-none focus:border-black transition-colors resize-none"></textarea>
          <button className="bg-black text-white px-12 py-4 rounded-full text-xl font-bold hover:scale-105 transition-transform">Submit</button>
        </form>
      </div>
    </div>
  );
}