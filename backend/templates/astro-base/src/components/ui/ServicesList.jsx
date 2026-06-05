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
}