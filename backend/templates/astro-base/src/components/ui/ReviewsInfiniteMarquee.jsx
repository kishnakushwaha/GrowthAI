import { motion } from 'framer-motion';

export function ReviewsInfiniteMarquee({ reviews }) {
  // Duplicate the array to create a seamless infinite loop
  const duplicatedReviews = [...reviews, ...reviews];

  return (
    <div className="py-24 overflow-hidden relative bg-stone-50 dark:bg-zinc-950">
      <div className="text-center mb-16 px-6">
        <h2 className="text-3xl md:text-5xl font-bold">What Our Clients Say</h2>
        <div className="w-24 h-1 bg-current mx-auto mt-6 opacity-20"></div>
      </div>
      
      {/* Left/Right fading gradients */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-stone-50 dark:from-zinc-950 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-stone-50 dark:from-zinc-950 to-transparent z-10 pointer-events-none"></div>

      <div className="flex">
        <motion.div
          animate={{ x: [0, -1035] }}
          transition={{ ease: "linear", duration: 20, repeat: Infinity }}
          className="flex gap-6 px-6"
        >
          {duplicatedReviews.map((review, index) => (
            <div 
              key={index}
              className="w-[320px] md:w-[400px] flex-shrink-0 bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl border border-black/5 dark:border-white/5"
            >
              <div className="flex text-yellow-400 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 italic mb-6 leading-relaxed">
                "{review.text}"
              </p>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{review.author}</p>
                {review.company && <p className="text-sm text-gray-500">{review.company}</p>}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
