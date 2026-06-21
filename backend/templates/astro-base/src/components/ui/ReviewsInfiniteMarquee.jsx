import { motion } from 'framer-motion';

export function ReviewsInfiniteMarquee({ reviews }) {
  const safeReviews = Array.isArray(reviews) && reviews.length > 0 ? reviews : [];
  const duplicatedReviews = [...safeReviews, ...safeReviews, ...safeReviews];

  if (safeReviews.length === 0) return null;

  return (
    <div className="py-12 overflow-hidden relative w-full">
      {/* Top and bottom separator lines */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

      {/* Left/Right fading gradients */}
      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-48 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-48 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none"></div>

      <div className="flex">
        <motion.div
          animate={{ x: [-(safeReviews.length * 420), 0] }}
          transition={{ ease: "linear", duration: Math.max(20, safeReviews.length * 9), repeat: Infinity }}
          className="flex gap-6 px-6"
        >
          {duplicatedReviews.map((review, index) => {
            // Render random colorful gradients for avatars
            const avatarGradients = [
              'from-emerald-400 to-teal-600',
              'from-blue-400 to-indigo-600',
              'from-violet-400 to-purple-600',
              'from-pink-400 to-rose-600',
              'from-amber-400 to-orange-600'
            ];
            const gradient = avatarGradients[index % avatarGradients.length];

            return (
              <div
                key={index}
                className="w-[340px] md:w-[420px] flex-shrink-0 bg-white/[0.02] hover:bg-white/[0.04] p-8 rounded-3xl border border-white/5 hover:border-white/15 transition-all duration-500 backdrop-blur-md flex flex-col justify-between shadow-xl"
              >
                <div>
                  {/* Rating Stars */}
                  <div className="flex text-amber-400 mb-6 gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current filter drop-shadow-[0_0_2px_rgba(245,158,11,0.3)]" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>

                  <p className="text-zinc-300 font-light italic mb-8 leading-relaxed text-sm md:text-base">
                    "{review.text}"
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                  {/* Styled avatar profile initial */}
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-extrabold shadow-inner`}>
                    {(review.author || 'P')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm tracking-wide">{review.author}</p>
                    {review.company && (
                      <p className="text-xs text-zinc-500 font-medium mt-0.5 tracking-wider uppercase">
                        {review.company}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
