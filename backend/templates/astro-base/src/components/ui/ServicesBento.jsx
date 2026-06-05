import React from 'react';
export function ServicesBento({ services }) {
  return (
    <div className="py-24 bg-white px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-[600px]">
          {services.map((s, i) => (
            <div key={i} className={`bg-zinc-100 rounded-3xl p-8 flex flex-col justify-end transition-transform hover:scale-[1.02] ${i === 0 ? 'md:col-span-2 md:row-span-2' : 'md:col-span-1 md:row-span-1'}`}>
              <h3 className="text-2xl font-bold mb-2">{s.title}</h3>
              <p className="text-zinc-600">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}