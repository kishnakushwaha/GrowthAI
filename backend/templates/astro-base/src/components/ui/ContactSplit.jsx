import { motion } from 'framer-motion';

function getColorClasses(primaryColor) {
  const color = primaryColor || 'emerald-600';
  const mapping = {
    'emerald-600': {
      text: 'text-emerald-400 group-hover:text-emerald-300',
      bg: 'bg-emerald-500/10 border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-black',
      btn: 'bg-emerald-500 hover:bg-emerald-600 text-black shadow-emerald-500/20',
      borderFocus: 'focus:border-emerald-500/50'
    },
    'blue-600': {
      text: 'text-blue-400 group-hover:text-blue-300',
      bg: 'bg-blue-500/10 border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white',
      btn: 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20',
      borderFocus: 'focus:border-blue-500/50'
    },
    'rose-600': {
      text: 'text-rose-400 group-hover:text-rose-300',
      bg: 'bg-rose-500/10 border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white',
      btn: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20',
      borderFocus: 'focus:border-rose-500/50'
    },
    'amber-500': {
      text: 'text-amber-400 group-hover:text-amber-300',
      bg: 'bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500 group-hover:text-black',
      btn: 'bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20',
      borderFocus: 'focus:border-amber-500/50'
    },
    'orange-500': {
      text: 'text-orange-400 group-hover:text-orange-300',
      bg: 'bg-orange-500/10 border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black',
      btn: 'bg-orange-500 hover:bg-orange-600 text-black shadow-orange-500/20',
      borderFocus: 'focus:border-orange-500/50'
    }
  };

  const base = color.split('-')[0] || 'emerald';
  const isLightText = base === 'blue' || base === 'rose' || base === 'purple';
  return mapping[color] || {
    text: `text-${base}-400 group-hover:text-${base}-300`,
    bg: `bg-${base}-500/10 border-${base}-500/20 group-hover:bg-${base}-500 group-hover:text-${isLightText ? 'white' : 'black'}`,
    btn: `bg-${base}-500 hover:bg-${base}-600 text-${isLightText ? 'white' : 'black'} shadow-${base}-500/20`,
    borderFocus: `focus:border-${base}-500/50`
  };
}

export function ContactSplit({ title, email, phone, address, primaryColor }) {
  const c = getColorClasses(primaryColor);

  return (
    <div className="flex flex-col lg:flex-row w-full bg-zinc-950 rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
      {/* Left Contact Info Panel */}
      <div className="flex-1 p-10 md:p-16 flex flex-col justify-center min-w-0 z-10">
        <motion.h2
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight font-['Outfit']"
        >
          {title || "Get In Touch"}
        </motion.h2>
        
        <div className="space-y-6">
          {phone && phone !== 'N/A' && (
            <motion.a
              href={`tel:${phone}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className={`flex items-center gap-4 text-zinc-300 hover:${c.text.split(' ')[0]} transition-all duration-300 group`}
            >
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 flex-shrink-0 border ${c.bg}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </span>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Phone Number</p>
                <p className="text-lg font-medium tracking-wide">{phone}</p>
              </div>
            </motion.a>
          )}
          
          {email && email !== 'N/A' && (
            <motion.a
              href={`mailto:${email}`}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className={`flex items-center gap-4 text-zinc-300 hover:${c.text.split(' ')[0]} transition-all duration-300 group`}
            >
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 flex-shrink-0 border ${c.bg}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </span>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Email Address</p>
                <p className="text-lg font-medium tracking-wide break-all">{email}</p>
              </div>
            </motion.a>
          )}
          
          {address && address !== 'N/A' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-4 text-zinc-300"
            >
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 border ${c.bg.split(' ')[0]} ${c.bg.split(' ')[1]}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </span>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Location</p>
                <p className="text-base leading-relaxed font-medium">{address}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Right Contact Form Panel */}
      <div className="flex-1 p-10 md:p-16 flex flex-col justify-center bg-white/[0.01] border-l border-white/5 min-w-0 z-10">
        <form className="space-y-5 w-full max-w-lg mx-auto" onSubmit={(e) => e.preventDefault()}>
          <div>
            <input 
              type="text" 
              placeholder="Your Name" 
              className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-zinc-500 outline-none ${c.borderFocus} focus:bg-white/[0.08] transition-all text-base shadow-inner font-light`} 
            />
          </div>
          <div>
            <input 
              type="email" 
              placeholder="Email Address" 
              className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-zinc-500 outline-none ${c.borderFocus} focus:bg-white/[0.08] transition-all text-base shadow-inner font-light`} 
            />
          </div>
          <div>
            <textarea 
              placeholder="Tell us about your needs..." 
              rows="4" 
              className={`w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-zinc-500 outline-none ${c.borderFocus} focus:bg-white/[0.08] transition-all resize-none text-base shadow-inner font-light`}
            ></textarea>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full font-extrabold py-4 rounded-2xl transition-all text-base tracking-wide shadow-lg ${c.btn}`}
          >
            Send Message
          </motion.button>
        </form>
      </div>
    </div>
  );
}