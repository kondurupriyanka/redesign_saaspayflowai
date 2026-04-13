import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  feedback: string;
  rating: number;
  image: {
    url: string;
    description: string;
  };
}

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
  autoScrollInterval?: number;
}

export function TestimonialCarousel({ testimonials, autoScrollInterval = 5000 }: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [testimonials.length, autoScrollInterval]);

  const current = testimonials[currentIndex];
  const next = testimonials[(currentIndex + 1) % testimonials.length];

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Image Carousel */}
      <div className="relative h-64 md:h-80 rounded-xl overflow-hidden bg-card border border-border/50">
        <AnimatePresence mode="wait">
          <motion.img
            key={current.image.url}
            src={current.image.url}
            alt={current.image.description}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        </AnimatePresence>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Image Badge */}
        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-white text-sm font-medium">{current.image.description}</p>
        </div>
      </div>

      {/* Testimonial Card */}
      <div className="flex-1 flex flex-col gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            className="flex-1 flex flex-col gap-4 p-5 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            {/* Rating */}
            <div className="flex gap-1">
              {Array.from({ length: current.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 fill-primary text-primary"
                />
              ))}
            </div>

            {/* Feedback */}
            <p className="text-sm md:text-base text-foreground leading-relaxed font-medium flex-1">
              "{current.feedback}"
            </p>

            {/* User Info */}
            <div className="flex items-center gap-3 pt-2 border-t border-border/30">
              <img
                src={current.avatar}
                alt={current.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="font-semibold text-sm">{current.name}</p>
                <p className="text-xs text-muted-foreground">{current.role} • {current.location}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Indicators */}
        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'bg-primary w-8' : 'bg-border/50 w-1.5'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
