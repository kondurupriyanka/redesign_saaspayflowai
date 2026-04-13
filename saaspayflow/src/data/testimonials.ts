export interface Testimonial {
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

export const testimonials: Testimonial[] = [
  {
    id: 'testimonial-1',
    name: 'James Mitchell',
    role: 'Business Consultant',
    location: 'London, UK',
    avatar: '/img1.jpeg',
    feedback: 'Set up was straightforward. Gets the job done. Late invoice reminders are automated now, which saves time.',
    rating: 4,
    image: {
      url: '/img1.jpeg',
      description: 'Professional workspace'
    }
  },
  {
    id: 'testimonial-2',
    name: 'Marcus Williams',
    role: 'Software Engineer',
    location: 'New York, USA',
    avatar: '/img2.jpeg',
    feedback: 'Works as expected. The automation takes the manual work out of chasing payments. Solid tool for freelancers.',
    rating: 5,
    image: {
      url: '/img2.jpeg',
      description: 'Developer setup'
    }
  },
  {
    id: 'testimonial-3',
    name: 'Sophie Anderson',
    role: 'Sound Engineer & Podcast Producer',
    location: 'Berlin, Germany',
    avatar: '/img3.jpeg',
    feedback: 'Not perfect, but helpful. Wish I had better export options for accounting. The reminders work though.',
    rating: 3,
    image: {
      url: '/img3.jpeg',
      description: 'Creative workspace'
    }
  },
  {
    id: 'testimonial-4',
    name: 'David Thompson',
    role: 'Financial Advisor',
    location: 'Toronto, Canada',
    avatar: '/img4.jpeg',
    feedback: 'Handles multiple client invoices well. Dashboard gives me visibility. Could use better filtering though.',
    rating: 4,
    image: {
      url: '/img4.jpeg',
      description: 'Professional workspace'
    }
  },
  {
    id: 'testimonial-5',
    name: 'Priya Shah',
    role: 'Brand Strategist',
    location: 'Bangalore, India',
    avatar: '/img5.jpeg',
    feedback: 'Getting paid on time is less stressful now. The AI reminders feel personal. Game-changer for my freelance clients.',
    rating: 5,
    image: {
      url: '/img5.jpeg',
      description: 'Workspace'
    }
  },
  {
    id: 'testimonial-6',
    name: 'Arjun Mehta',
    role: 'Full-Stack Developer',
    location: 'Bangalore, India',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80',
    feedback: 'I got paid faster this week. Clients respond quicker to AI reminders than my manual follow-ups.',
    rating: 5,
    image: {
      url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
      description: 'Developer workspace'
    }
  },
  {
    id: 'testimonial-7',
    name: 'Sneha Kapoor',
    role: 'UI/UX Designer',
    location: 'Mumbai, India',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&q=80',
    feedback: 'Reminders feel natural, not awkward. Clients actually respond. Better than constant WhatsApp messages.',
    rating: 5,
    image: {
      url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
      description: 'Design workspace'
    }
  },
  {
    id: 'testimonial-8',
    name: 'Daniel Reed',
    role: 'Freelance Consultant',
    location: 'Austin, USA',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80',
    feedback: 'Saving me hours chasing invoices. Interface could be more intuitive, but the core features are solid.',
    rating: 4,
    image: {
      url: 'https://images.unsplash.com/photo-1460925895917-adf4e565db18?w=600&h=400&fit=crop',
      description: 'Workspace setup'
    }
  },
  {
    id: 'testimonial-9',
    name: 'Kenji Tanaka',
    role: 'Video Editor & Animator',
    location: 'Tokyo, Japan',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&q=80',
    feedback: 'Simple but effective. Payments are coming in quicker. Dashboard is clean and straightforward to use.',
    rating: 5,
    image: {
      url: 'https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=600&h=400&fit=crop',
      description: 'Creative workspace'
    }
  },
  {
    id: 'testimonial-10',
    name: 'Nisha Sharma',
    role: 'Social Media Manager',
    location: 'Pune, India',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80',
    feedback: 'Still testing it. The automation is helpful, but integration with my other tools needs improvement.',
    rating: 3,
    image: {
      url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop',
      description: 'Office desk'
    }
  }
];
