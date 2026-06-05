import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UI_DIR = path.join(__dirname, 'src', 'components', 'ui');
fs.mkdirSync(UI_DIR, { recursive: true });

const components = {
  // 10 Heros
  'HeroWavy.jsx': `
import React from 'react';
import { motion } from 'framer-motion';
export function HeroWavy({ title, subtitle, cta }) {
  return (
    <div className="relative h-screen flex flex-col items-center justify-center overflow-hidden bg-black text-white">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="z-10 text-center space-y-6">
        <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">{title}</h1>
        <p className="text-xl md:text-2xl text-neutral-300 max-w-2xl mx-auto">{subtitle}</p>
        <button className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:scale-105 transition-transform">{cta}</button>
      </motion.div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black"></div>
    </div>
  );
}`,
  'HeroTracingBeam.jsx': `
import React from 'react';
import { motion } from 'framer-motion';
export function HeroTracingBeam({ title, subtitle, cta }) {
  return (
    <div className="relative min-h-[90vh] flex items-center bg-zinc-950 text-white overflow-hidden">
      <div className="absolute left-0 w-1 h-full bg-gradient-to-b from-blue-500 via-purple-500 to-transparent opacity-50 blur-[2px]"></div>
      <div className="container mx-auto px-8 relative z-10">
        <motion.h1 initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="text-6xl font-black mb-6">{title}</motion.h1>
        <motion.p initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="text-2xl text-zinc-400 mb-8 max-w-xl">{subtitle}</motion.p>
        <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg text-lg font-medium">{cta}</motion.button>
      </div>
    </div>
  );
}`,
  'HeroGlass.jsx': `
import React from 'react';
export function HeroGlass({ title, subtitle, cta }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
      <div className="relative z-10 bg-white/10 p-12 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-md">{title}</h1>
        <p className="text-2xl text-neutral-200 mb-8 font-light">{subtitle}</p>
        <button className="bg-white/20 hover:bg-white/30 border border-white/50 text-white px-10 py-4 rounded-full backdrop-blur-sm transition-all text-lg font-semibold tracking-wide">{cta}</button>
      </div>
    </div>
  );
}`,
  'HeroSplit.jsx': `
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
}`,
  'HeroMinimal.jsx': `
import React from 'react';
export function HeroMinimal({ title, subtitle, cta }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAFAFA] text-zinc-900 px-6">
      <h1 className="text-6xl md:text-8xl font-medium tracking-tighter text-center mb-8 max-w-5xl">{title}</h1>
      <p className="text-2xl text-zinc-500 mb-12 text-center max-w-2xl">{subtitle}</p>
      <button className="px-6 py-3 border border-zinc-200 hover:border-zinc-900 rounded-full transition-colors font-medium">{cta}</button>
    </div>
  );
}`,
  'HeroGrid.jsx': `
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
}`,
  'HeroVideo.jsx': `
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
}`,
  'HeroAbstract.jsx': `
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
}`,
  'HeroTypography.jsx': `
import React from 'react';
export function HeroTypography({ title, subtitle, cta }) {
  return (
    <div className="min-h-screen bg-amber-50 flex flex-col justify-center px-8 md:px-24">
      <h1 className="text-[10vw] font-serif leading-none tracking-tighter text-amber-950 uppercase">{title}</h1>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mt-12 gap-8">
        <p className="text-2xl md:text-4xl max-w-2xl text-amber-900/80 font-serif italic">{subtitle}</p>
        <button className="text-xl border-b-2 border-amber-950 text-amber-950 pb-1 hover:text-amber-700 hover:border-amber-700 transition-colors">{cta} -></button>
      </div>
    </div>
  );
}`,
  'HeroDarkMatter.jsx': `
import React from 'react';
export function HeroDarkMatter({ title, subtitle, cta }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center text-center p-8">
      <div className="inline-block mb-4 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-400 text-sm">New Release</div>
      <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-600 mb-6 tracking-tight">{title}</h1>
      <p className="text-xl text-zinc-500 max-w-xl mb-10">{subtitle}</p>
      <button className="bg-zinc-100 text-zinc-900 px-8 py-3 rounded-md font-medium hover:bg-white transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]">{cta}</button>
    </div>
  );
}`,

  // 6 Review Carousels
  'ReviewsMarquee.jsx': `
import React from 'react';
import { motion } from 'framer-motion';
export function ReviewsMarquee({ reviews }) {
  return (
    <div className="py-24 bg-white overflow-hidden flex flex-col items-center">
      <h2 className="text-4xl font-bold mb-16 text-center">What Our Clients Say</h2>
      <div className="flex space-x-6 animate-[marquee_20s_linear_infinite] whitespace-nowrap px-4">
        {reviews.concat(reviews).map((r, i) => (
          <div key={i} className="inline-block w-96 p-8 rounded-2xl bg-zinc-50 border border-zinc-100 shadow-sm whitespace-normal">
            <div className="flex text-yellow-400 mb-4">{"★".repeat(r.rating)}</div>
            <p className="text-zinc-700 text-lg mb-6 italic">"{r.text}"</p>
            <p className="font-semibold text-zinc-900">- {r.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}`,
  'ReviewsMasonry.jsx': `
import React from 'react';
export function ReviewsMasonry({ reviews }) {
  return (
    <div className="py-24 bg-zinc-950 px-8">
      <h2 className="text-4xl font-bold mb-16 text-center text-white">Client Testimonials</h2>
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 max-w-7xl mx-auto">
        {reviews.map((r, i) => (
          <div key={i} className="break-inside-avoid p-8 rounded-2xl bg-zinc-900 border border-zinc-800">
            <p className="text-zinc-300 text-lg mb-6">"{r.text}"</p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold">{r.author[0]}</div>
              <div>
                <p className="font-medium text-white">{r.author}</p>
                <div className="flex text-yellow-500 text-sm">{"★".repeat(r.rating)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`,
  'ReviewsSlider.jsx': `
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
export function ReviewsSlider({ reviews }) {
  const [idx, setIdx] = useState(0);
  return (
    <div className="py-32 bg-blue-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center relative h-64">
        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute inset-0">
            <p className="text-3xl md:text-5xl text-blue-900 font-serif leading-tight mb-8">"{reviews[idx]?.text}"</p>
            <p className="text-lg font-semibold text-blue-800">{reviews[idx]?.author}</p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="flex gap-2 mt-8">
        {reviews.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} className={\`w-3 h-3 rounded-full transition-all \${i === idx ? 'bg-blue-600 w-8' : 'bg-blue-300'}\`}></button>
        ))}
      </div>
    </div>
  );
}`,
  'ReviewsGlass.jsx': `
import React from 'react';
export function ReviewsGlass({ reviews }) {
  return (
    <div className="py-24 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80')] bg-cover bg-fixed px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {reviews.slice(0,3).map((r, i) => (
          <div key={i} className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-3xl text-white">
            <div className="flex text-amber-300 mb-4">{"★".repeat(r.rating)}</div>
            <p className="text-xl mb-6 font-light">"{r.text}"</p>
            <p className="font-bold">{r.author}</p>
          </div>
        ))}
      </div>
    </div>
  );
}`,
  'ReviewsMinimal.jsx': `
import React from 'react';
export function ReviewsMinimal({ reviews }) {
  return (
    <div className="py-24 bg-white max-w-5xl mx-auto px-8 divide-y divide-zinc-200">
      <h2 className="text-3xl font-medium mb-12">Recent Feedback</h2>
      {reviews.map((r, i) => (
        <div key={i} className="py-8 flex flex-col md:flex-row gap-8">
          <div className="md:w-1/4">
            <p className="font-semibold text-zinc-900">{r.author}</p>
            <div className="flex text-zinc-400 text-sm mt-1">{"★".repeat(r.rating)}</div>
          </div>
          <div className="md:w-3/4">
            <p className="text-xl text-zinc-600 leading-relaxed">{r.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}`,
  'ReviewsCards.jsx': `
import React from 'react';
export function ReviewsCards({ reviews }) {
  return (
    <div className="py-24 bg-zinc-100 px-8">
      <h2 className="text-center text-4xl font-black mb-16 text-zinc-900 uppercase tracking-widest">Reviews</h2>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {reviews.map((r, i) => (
          <div key={i} className="bg-white p-10 rounded-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
            <p className="text-2xl font-bold mb-4">"{r.text}"</p>
            <div className="flex justify-between items-end mt-8">
              <span className="font-bold text-xl">{r.author}</span>
              <span className="text-yellow-500 text-2xl">{"★".repeat(r.rating)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}`,

  // 6 Service Grids
  'ServicesBento.jsx': `
import React from 'react';
export function ServicesBento({ services }) {
  return (
    <div className="py-24 bg-white px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[600px]">
          {services.map((s, i) => (
            <div key={i} className={\`bg-zinc-100 rounded-3xl p-8 flex flex-col justify-end transition-transform hover:scale-[1.02] \${i === 0 ? 'md:col-span-2 md:row-span-2' : 'md:col-span-1 md:row-span-1'}\`}>
              <h3 className="text-2xl font-bold mb-2">{s.title}</h3>
              <p className="text-zinc-600">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}`,
  'ServicesMinimal.jsx': `
import React from 'react';
export function ServicesMinimal({ services }) {
  return (
    <div className="py-24 bg-black text-white px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-16">
        {services.map((s, i) => (
          <div key={i} className="border-t border-zinc-800 pt-8">
            <div className="text-4xl mb-6 opacity-50">0{i+1}</div>
            <h3 className="text-2xl font-medium mb-4">{s.title}</h3>
            <p className="text-zinc-400">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}`,
  'ServicesCards.jsx': `
import React from 'react';
export function ServicesCards({ services }) {
  return (
    <div className="py-24 bg-zinc-50 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {services.map((s, i) => (
          <div key={i} className="bg-white p-10 rounded-2xl shadow-xl shadow-zinc-200/50 hover:-translate-y-2 transition-transform border border-zinc-100">
            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl mb-8 flex items-center justify-center">✦</div>
            <h3 className="text-2xl font-bold mb-4 text-zinc-900">{s.title}</h3>
            <p className="text-zinc-600 leading-relaxed">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}`,
  'ServicesGlass.jsx': `
import React from 'react';
export function ServicesGlass({ services }) {
  return (
    <div className="py-32 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80')] bg-cover bg-fixed relative">
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="max-w-6xl mx-auto relative z-10 px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((s, i) => (
          <div key={i} className="p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
            <h3 className="text-3xl font-bold text-white mb-4">{s.title}</h3>
            <p className="text-zinc-300 text-lg">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}`,
  'ServicesBrutal.jsx': `
import React from 'react';
export function ServicesBrutal({ services }) {
  return (
    <div className="py-24 bg-yellow-400 px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((s, i) => (
          <div key={i} className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-3xl font-black uppercase mb-4">{s.title}</h3>
            <div className="h-1 w-full bg-black mb-4"></div>
            <p className="text-xl font-medium">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}`,
  'ServicesList.jsx': `
import React from 'react';
export function ServicesList({ services }) {
  return (
    <div className="py-24 bg-white px-8">
      <div className="max-w-4xl mx-auto divide-y divide-zinc-200">
        <h2 className="text-5xl font-bold mb-12 tracking-tight">Capabilities</h2>
        {services.map((s, i) => (
          <div key={i} className="py-8 group cursor-pointer hover:pl-4 transition-all flex flex-col md:flex-row md:items-center justify-between">
            <h3 className="text-3xl font-medium text-zinc-900 group-hover:text-blue-600 transition-colors">{s.title}</h3>
            <p className="text-zinc-500 md:w-1/2 mt-4 md:mt-0">{s.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}`,

  // 6 Contact Sections
  'ContactSplit.jsx': `
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
}`,
  'ContactMinimal.jsx': `
import React from 'react';
export function ContactMinimal({ title, email }) {
  return (
    <div className="py-32 bg-white text-center px-4">
      <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-8">{title}</h2>
      <a href={\`mailto:\${email}\`} className="text-2xl md:text-4xl text-blue-600 hover:text-blue-800 transition-colors border-b-2 border-blue-200 hover:border-blue-800 pb-2">{email}</a>
    </div>
  );
}`,
  'ContactGlass.jsx': `
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
}`,
  'ContactMap.jsx': `
import React from 'react';
export function ContactMap({ title, address, email }) {
  return (
    <div className="relative h-screen bg-zinc-200">
      <div className="absolute inset-0 bg-zinc-300 flex items-center justify-center text-zinc-400 text-xl">[Interactive Map Integration Placeholder]</div>
      <div className="absolute bottom-12 left-12 bg-white p-10 rounded-2xl shadow-2xl max-w-sm z-10">
        <h2 className="text-3xl font-bold mb-4">{title}</h2>
        <p className="text-zinc-600 mb-6">{address}</p>
        <a href={\`mailto:\${email}\`} className="font-bold text-blue-600 hover:underline">{email}</a>
      </div>
    </div>
  );
}`,
  'ContactDark.jsx': `
import React from 'react';
export function ContactDark({ title, email, phone }) {
  return (
    <div className="py-32 bg-zinc-950 text-white px-8">
      <div className="max-w-4xl mx-auto text-center border border-zinc-800 rounded-3xl p-16 bg-zinc-900/50">
        <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500 mb-8">{title}</h2>
        <p className="text-2xl text-zinc-400 mb-12">Let's build something extraordinary together.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-8 text-xl">
          <a href={\`mailto:\${email}\`} className="hover:text-blue-400 transition-colors">{email}</a>
          <span className="hidden sm:inline text-zinc-700">|</span>
          <a href={\`tel:\${phone}\`} className="hover:text-blue-400 transition-colors">{phone}</a>
        </div>
      </div>
    </div>
  );
}`,
  'ContactBrutal.jsx': `
import React from 'react';
export function ContactBrutal({ title, email }) {
  return (
    <div className="py-24 bg-pink-500 px-8 flex flex-col items-center">
      <div className="bg-white border-4 border-black p-12 max-w-3xl w-full shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] text-center">
        <h2 className="text-6xl font-black uppercase mb-8">{title}</h2>
        <a href={\`mailto:\${email}\`} className="block bg-black text-white text-3xl font-bold py-6 hover:bg-zinc-800 transition-colors">{email}</a>
      </div>
    </div>
  );
}`
};

Object.entries(components).forEach(([name, content]) => {
  fs.writeFileSync(path.join(UI_DIR, name), content.trim());
});

console.log('✅ 28 Premium Components Generated!');
