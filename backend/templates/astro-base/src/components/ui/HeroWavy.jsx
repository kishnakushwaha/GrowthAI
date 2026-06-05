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
}