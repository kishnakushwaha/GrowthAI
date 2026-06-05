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
}