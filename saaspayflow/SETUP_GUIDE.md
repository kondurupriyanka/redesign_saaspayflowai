# PayFlow AI - Setup & Deployment Guide

## 🚀 Quick Start

### 1. Installation

```bash
# Install dependencies
npm install

# Or using bun (if available)
bun install
```

### 2. Environment Setup

```bash
# Copy the example env file
cp .env.example .env.local

# Update with your credentials:
# - Google OAuth credentials
# - GitHub OAuth credentials
# - API endpoints
```

### 3. Development Server

```bash
# Start Vite dev server (Port 8080)
npm run dev

# Or with Bun
bun run dev

# Visit: http://localhost:8080
```

### 4. Build for Production

```bash
# Build the project
npm run build

# Preview production build
npm run preview
```

---

## 📋 Project Structure

```
src/
├── components/
│   ├── AuthPage.tsx              (✅ Enhanced auth with 2 steps)
│   ├── Navbar.tsx                (✅ Updated with notifications)
│   ├── NotificationDropdown.tsx   (✅ New notification system)
│   ├── MinimalFooter.tsx          (✅ Updated branding)
│   ├── SocialProof.tsx            (✅ Using TestimonialsColumn)
│   ├── HeroSection.tsx
│   ├── FeaturesGrid.tsx
│   ├── PricingSection.tsx
│   ├── CTASection.tsx
│   └── ui/
│       ├── BackgroundPaths.tsx    (✅ Green theme)
│       ├── TestimonialsColumn.tsx (✅ Animated testimonials)
│       ├── GlowCard.tsx           (✅ Green glow)
│       ├── Loader.tsx             (✅ Enhanced)
│       └── [other UI components]
├── pages/
│   ├── Index.tsx
│   └── NotFound.tsx
├── hooks/
│   ├── useScrollAnimation.ts
│   └── use-toast.ts
├── lib/
│   └── utils.ts
├── assets/
│   └── logo.png
└── App.tsx
```

---

## 🎨 Color System Reference

### Primary Green
```css
/* All uses of primary color */
--primary: 84 100% 62%; /* #A3FF3F */

/* Usage */
bg-primary           /* Green background */
text-primary         /* Green text */
border-primary       /* Green border */
shadow-primary       /* Green shadow */
hover:bg-primary/90  /* Darker green on hover */
```

### Component Colors
```css
/* Backgrounds */
bg-background        /* #0B0F0C - Dark base */
bg-card             /* Card surfaces */
bg-muted/50         /* Muted backgrounds */
bg-primary/10       /* Light green tint */

/* Text */
text-foreground     /* White text */
text-muted-foreground /* Gray text */

/* Borders */
border-border       /* Subtle borders */
border-primary/30   /* Green borders */
```

---

## 📝 Authentication Flow

###  Step 1: Signup/Login
- Email and password (manual entry)
- Google OAuth
- GitHub OAuth (optional)

### Step 2: Notification Preferences
- Email reminders (default: ON)
- Payment alerts (default: ON)
- Weekly summary (default: OFF)
- WhatsApp reminders (future)

---

## 🔔 Notification System

### Notification Types
1. **Payment**: When payment is received
2. **Reminder**: When AI reminder is sent
3. **Alert**: When payment is overdue

### Notification Features
- Mark as read
- Clear all notifications
- Time formatting (2h ago, etc.)
- Unread count badge
- Dropdown panel in navbar

---

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile-Specific Changes
- Navbar: Hamburger menu (mobile) vs. full menu (desktop)
- AuthPage: Full-width (mobile) vs. two-column (desktop)
- Testimonials: Single column (mobile) vs. 3 columns (desktop)
- Footer: Stacked (mobile) vs. 5-column grid (desktop)

---

## 🔐 Security Checklist

- ✅ Environment variables in .env.local (not committed)
- ✅ OAuth credentials properly stored
- ✅ No sensitive data in code
- ⏳ HTTPS enforced in production
- ⏳ CORS configured properly

---

## 📊 Performance Optimization

### Current Optimizations
- ✅ Code splitting with React Router
- ✅ Lazy loading components
- ✅ CSS minification with Tailwind
- ✅ Image optimization (Unsplash URLs)
- ✅ Smooth animations (GPU accelerated)

### Build Stats
```bash
# Run for production bundle analysis
npm run build -- --analyze
```

---

## 🧪 Testing

### Component Testing
```bash
# Run tests
npm run test

# Watch mode
npm run test:watch
```

### E2E Testing (Playwright)
```bash
# Run Playwright tests
npx playwright test

# Debug mode
npx playwright test --debug
```

---

## 📦 Dependencies

### Core
- React 18.3
- React Router 6.30
- Vite 5.4
- TypeScript

### UI & Styling
- Tailwind CSS 3.x
- Radix UI Components
- Shadcn/ui
- Lucide Icons

### Animations
- Framer Motion 12.38

### Forms & Data
- React Hook Form 7.61
- Zod 3.25
- TanStack React Query 5.83

---

## 🌐 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy
```

### Docker
```bash
# Build Docker image
docker build -t payflow-ai .

# Run container
docker run -p 8080:8080 payflow-ai
```

---

## 🐛 Troubleshooting

### Port 8080 Already in Use
```bash
# Kill process on port 8080
lsof -ti:8080 | xargs kill -9

# Or use different port
npm run dev -- --port 3000
```

### Vite HMR Issues
Update `vite.config.ts`:
```typescript
server: {
  hmr: {
    host: 'localhost',
    port: 8080,
  }
}
```

### Component Import Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 📚 Additional Resources

1. **Vite**: https://vitejs.dev
2. **React**: https://react.dev
3. **Tailwind CSS**: https://tailwindcss.com
4. **Shadcn/ui**: https://ui.shadcn.com
5. **Radix UI**: https://www.radix-ui.com
6. **Framer Motion**: https://www.framer.com/motion

---

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Create a pull request

---

## 📄 License

This project is proprietary and confidential.

---

Last Updated: April 2, 2026
