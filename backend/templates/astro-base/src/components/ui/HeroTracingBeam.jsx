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
}