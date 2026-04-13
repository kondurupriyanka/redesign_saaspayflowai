"use client";
import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

export interface Testimonial {
  text: string;
  image: string;
  name: string;
  role: string;
  rating?: number;
}

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: Testimonial[];
  duration?: number;
  pauseOnHover?: boolean;
}) => {
  const [isPaused, setIsPaused] = React.useState(false);

  return (
    <div 
      className={`${props.className} overflow-hidden`}
      onMouseEnter={() => props.pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <motion.div
        animate={{
          translateY: isPaused ? "0%" : "-50%",
        }}
        transition={{
          duration: props.duration || 25,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[...new Array(2).fill(0)].map((_, index) => (
          <React.Fragment key={index}>
            {props.testimonials.map(({ text, image, name, role, rating = 5 }, i) => (
              <div 
                key={`${index}-${i}`}
                className="p-6 rounded-2xl border border-white/5 bg-[#111] max-w-xs w-full hover:scale-[1.02] transition-transform duration-200"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star 
                      key={j} 
                      className={`w-4 h-4 ${j < rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{text}</p>
                <div className="flex items-center gap-3">
                  <img
                    width={40}
                    height={40}
                    src={image}
                    alt={name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-foreground">{name}</div>
                    <div className="text-xs text-muted-foreground">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </React.Fragment>
        ))}
      </motion.div>
    </div>
  );
};
