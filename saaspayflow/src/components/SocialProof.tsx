import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { TestimonialsColumn } from './ui/TestimonialsColumn';
import type { Testimonial } from './ui/TestimonialsColumn';
import img1 from '@/assets/img1.jpeg';
import img2 from '@/assets/img2.jpeg';
import img3 from '@/assets/img3.jpeg';
import img4 from '@/assets/img4.jpeg';
import img5 from '@/assets/img5.jpeg';

const testimonials: Testimonial[] = [
  {
    name: "James Mitchell",
    role: "Business Consultant • London",
    image: img1,
    text: "Set up was straightforward. Gets the job done. Late invoice reminders are automated now, which saves time.",
    rating: 4,
  },
  {
    name: "Marcus Williams",
    role: "Software Engineer • New York",
    image: img2,
    text: "Works as expected. The automation takes the manual work out of chasing payments. Solid tool for freelancers.",
    rating: 5,
  },
  {
    name: "Sophie Anderson",
    role: "Sound Engineer & Podcast Producer • Berlin",
    image: img3,
    text: "Not perfect, but helpful. Wish I had better export options for accounting. The reminders work though.",
    rating: 3,
  },
  {
    name: "David Thompson",
    role: "Financial Advisor • Toronto",
    image: img4,
    text: "Handles multiple client invoices well. Dashboard gives me visibility. Could use better filtering though.",
    rating: 4,
  },
  {
    name: "Priya Shah",
    role: "Brand Strategist • Bangalore",
    image: img5,
    text: "Getting paid on time is less stressful now. The AI reminders feel personal. Game-changer for my freelance clients.",
    rating: 5,
  },
  {
    name: "Arjun Mehta",
    role: "Full-Stack Developer • Bangalore",
    image: img1,
    text: "I got paid faster this week. Clients respond quicker to AI reminders than my manual follow-ups.",
    rating: 5,
  },
  {
    name: "Sneha Kapoor",
    role: "UI/UX Designer • Mumbai",
    image: img3,
    text: "Reminders feel natural, not awkward. Clients actually respond. Better than constant WhatsApp messages.",
    rating: 5,
  },
  {
    name: "Daniel Reed",
    role: "Freelance Consultant • Austin",
    image: img2,
    text: "Saving me hours chasing invoices. Interface could be more intuitive, but the core features are solid.",
    rating: 4,
  },
  {
    name: "Kenji Tanaka",
    role: "Video Editor & Animator • Tokyo",
    image: img4,
    text: "Simple but effective. Payments are coming in quicker. Dashboard is clean and straightforward to use.",
    rating: 5,
  },
  {
    name: "Nisha Sharma",
    role: "Social Media Manager • Pune",
    image: img5,
    text: "Still testing it. The automation is helpful, but integration with my other tools needs improvement.",
    rating: 3,
  },
];

const SocialProof = () => {
  const { ref, isVisible } = useScrollAnimation();

  const col1 = [testimonials[0], testimonials[3], testimonials[6], testimonials[9]];
  const col2 = [testimonials[1], testimonials[4], testimonials[7]];
  const col3 = [testimonials[2], testimonials[5], testimonials[8]];

  return (
    <section className="relative py-20 md:py-28 px-6 overflow-hidden" ref={ref}>
      {/* Subtle top radial glow for section depth */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 40% at 50% 0%, hsl(84 100% 62% / 0.045) 0%, transparent 70%)',
      }} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-20 text-center">
          <p className="caption-lg text-primary mb-5">Trusted by professionals</p>
          <h2 className="display-md mb-8">
            Real results from <span className="text-gradient">real freelancers</span>
          </h2>

          {/* Trust stats row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 mb-8">
            <div className="flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-[#A3FF3F]/8 border border-[#A3FF3F]/20">
              <span className="text-3xl font-extrabold text-[#A3FF3F] tracking-tight leading-none">1,200+</span>
              <span className="text-base font-medium text-white/80 leading-snug text-left">freelancers<br/>trust PayFlow AI</span>
            </div>
            <div className="hidden sm:block w-px h-10 bg-white/10" />
            <div className="flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-[#A3FF3F]/8 border border-[#A3FF3F]/20">
              <span className="text-3xl font-extrabold text-[#A3FF3F] tracking-tight leading-none">₹50L+</span>
              <span className="text-base font-medium text-white/80 leading-snug text-left">recovered in<br/>late payments</span>
            </div>
          </div>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">See how professionals across industries are improving cash flow with smarter payment collection.</p>
        </div>

        {/* Animated Testimonials Columns - Hidden on mobile, visible on desktop */}
        <div className={`hidden lg:grid lg:grid-cols-3 gap-6 h-96 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <TestimonialsColumn
            testimonials={col1}
            duration={25}
            pauseOnHover
            className="h-96"
          />
          <TestimonialsColumn
            testimonials={col2}
            duration={25}
            pauseOnHover
            className="h-96"
          />
          <TestimonialsColumn
            testimonials={col3}
            duration={25}
            pauseOnHover
            className="h-96"
          />
        </div>

        {/* Single Column - Visible on mobile/tablet */}
        <div className={`lg:hidden ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <TestimonialsColumn
            testimonials={testimonials}
            duration={30}
            pauseOnHover
            className="h-80"
          />
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
