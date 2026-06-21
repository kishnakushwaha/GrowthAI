import { motion } from 'framer-motion';

function getColorClasses(primaryColor) {
  const color = primaryColor || 'emerald-600';
  const mapping = {
    'emerald-600': {
      text: 'text-emerald-400',
      border: 'border-emerald-500/20 hover:border-emerald-500/35',
      bg: 'bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-black',
      shadow: 'hover:shadow-emerald-500/5 hover:border-emerald-500/30'
    },
    'blue-600': {
      text: 'text-blue-400',
      border: 'border-blue-500/20 hover:border-blue-500/35',
      bg: 'bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white',
      shadow: 'hover:shadow-blue-500/5 hover:border-blue-500/30'
    },
    'rose-600': {
      text: 'text-rose-400',
      border: 'border-rose-500/20 hover:border-rose-500/35',
      bg: 'bg-rose-500/10 group-hover:bg-rose-500 group-hover:text-white',
      shadow: 'hover:shadow-rose-500/5 hover:border-rose-500/30'
    },
    'amber-500': {
      text: 'text-amber-400',
      border: 'border-amber-500/20 hover:border-amber-500/35',
      bg: 'bg-amber-500/10 group-hover:bg-amber-500 group-hover:text-black',
      shadow: 'hover:shadow-amber-500/5 hover:border-amber-500/30'
    },
    'orange-500': {
      text: 'text-orange-400',
      border: 'border-orange-500/20 hover:border-orange-500/35',
      bg: 'bg-orange-500/10 group-hover:bg-orange-500 group-hover:text-black',
      shadow: 'hover:shadow-orange-500/5 hover:border-orange-500/30'
    }
  };

  const base = color.split('-')[0] || 'emerald';
  return mapping[color] || {
    text: `text-${base}-450`,
    border: `border-${base}-500/20 hover:border-${base}-500/35`,
    bg: `bg-${base}-500/10 group-hover:bg-${base}-500 group-hover:text-black`,
    shadow: `hover:shadow-${base}-500/5 hover:border-${base}-500/30`
  };
}

export function ServicesBento({ services, primaryColor }) {
  const safeServices = Array.isArray(services) ? services : [];
  const c = getColorClasses(primaryColor);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px] md:auto-rows-[340px]">
      {safeServices.map((s, i) => {
        // Asymmetric Bento Layout
        const isWide = i === 0 || i === 3;
        
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            whileHover={{ y: -6, scale: 1.01 }}
            className={`relative rounded-3xl p-8 md:p-10 flex flex-col justify-between overflow-hidden group border bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-xl shadow-2xl transition-all duration-500 ${c.border} ${c.shadow} ${
              isWide ? 'md:col-span-2' : 'md:col-span-1'
            }`}
          >
            {/* Background image zoom-on-hover effect */}
            {s.image && (
              <div className="absolute inset-0 z-0">
                <img 
                  src={s.image} 
                  alt={s.title} 
                  className="w-full h-full object-cover opacity-15 group-hover:opacity-30 group-hover:scale-105 transition-all duration-700" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent"></div>
              </div>
            )}
            
            {/* Top row: Icon / Step Indicator */}
            <div className="relative z-10 flex justify-between items-start">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-500 border ${c.bg} ${c.border.split(' ')[0]}`}>
                {String(i + 1).padStart(2, '0')}
              </div>
              {s.whoNeedsIt && (
                <span className="text-xs font-semibold tracking-wider text-zinc-400 bg-white/5 border border-white/5 rounded-full px-3 py-1 uppercase backdrop-blur-sm">
                  {s.whoNeedsIt}
                </span>
              )}
            </div>

            {/* Bottom Content */}
            <div className="relative z-10 space-y-3">
              <h3 className={`text-2xl font-bold text-white group-hover:${c.text.split(' ')[0]} transition-colors duration-300 font-['Outfit']`}>
                {s.title}
              </h3>
              <p className="text-zinc-400 text-sm leading-relaxed font-light group-hover:text-zinc-300 transition-colors duration-300 line-clamp-3">
                {s.description}
              </p>
              
              {/* Optional services bullets list */}
              {s.benefits && s.benefits.length > 0 && (
                <div className="hidden group-hover:flex flex-wrap gap-2 pt-2 transition-all duration-500">
                  {s.benefits.map((b, idx) => (
                    <span key={idx} className={`text-xs px-2 py-0.5 rounded-md font-medium border ${c.text} bg-white/5 border-white/5`}>
                      ✓ {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}