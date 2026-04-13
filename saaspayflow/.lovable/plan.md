

# PayFlow AI — Full Landing Page Build with Enhanced Financial Urgency

This is a full build from scratch (placeholder page exists). The plan incorporates all previously agreed requirements PLUS the new enhancements for financial urgency, motion, and micro-interactions.

## Architecture

```text
src/
├── pages/Index.tsx          — Main landing page (orchestrates all sections)
├── components/
│   ├── Navbar.tsx
│   ├── HeroSection.tsx      — Parallax background, glowing dashboard
│   ├── SocialProof.tsx      — Testimonial cards
│   ├── HowItWorks.tsx       — 3-step flow
│   ├── FeaturesGrid.tsx     — 6 payment-focused features
│   ├── DashboardSection.tsx — ★ Financial command center (NEW ENHANCEMENTS)
│   ├── PricingSection.tsx   — 3 plans, toggles
│   ├── FeatureStrip.tsx     — Invoicing/Payments/Expenses
│   ├── CTASection.tsx       — Final CTA
│   ├── Footer.tsx
│   ├── FeatureCard.tsx
│   ├── PricingCard.tsx
│   ├── TestimonialCard.tsx
│   ├── StepCard.tsx
│   └── GlowWrapper.tsx
```

## New Enhancements (This Request)

### 1. Dashboard as Financial Command Center
- **Overdue Amount Card**: Red/amber gradient card showing "₹45,000 Overdue" with pulsing dot indicator
- **Urgency Labels**: "2 clients overdue", "₹1,23,000 pending" in amber/red badges
- **Notification Indicators**: Small red dots on invoice items, unread-style counters
- **Activity Timeline**: Right-side feed showing:
  - "Reminder sent to Priya — 2 hrs ago"
  - "Payment received from Arjun — ₹15,000"
  - "Final notice sent to Rahul — overdue 7 days"
  - Color-coded: green (paid), amber (reminder), red (overdue)
- **Revenue bar chart** with overdue bars highlighted in red vs paid in green

### 2. Logo Motion
- CSS `@keyframes` subtle pulse animation on the logo icon (scale 1→1.05→1, 3s loop)
- Gentle green glow pulse synced with scale

### 3. Hero Parallax
- Use `onScroll` listener with `transform: translateY()` at different rates for:
  - Background glow layer (slow)
  - Dashboard mockup (medium)
  - Text content (stays fixed)
- Lightweight CSS transforms only, no library needed

### 4. Button Micro-interactions
- `transition: transform 0.2s, box-shadow 0.2s`
- Hover: `scale(1.03)` + intensified green glow shadow
- Active: `scale(0.98)` for tactile press feel
- Applied globally via custom button variants

## Design System Updates

**index.css** — Add CSS variables:
- `--overdue: 0 84% 60%` (red)
- `--warning: 38 92% 50%` (amber)
- `--success: 142 76% 36%` (green for paid)
- Plus Jakarta Sans import from Google Fonts
- Custom keyframes for logo pulse, fade-in-up, parallax layers

**tailwind.config.ts** — Extend with:
- `overdue`, `warning`, `success` colors
- New animation keyframes (fade-in-up, pulse-glow, float)

## Key Sections Detail

### Hero
- Dark bg `#050A07` with radial green glow (CSS gradient)
- Left: badge + headline + subtext + 2 CTAs with micro-interactions
- Right: large dashboard preview card with green glow border, showing mini overdue indicators
- Parallax: glow moves slower than content on scroll

### Dashboard Section (centerpiece)
```text
┌─────────────────────────────────────────────┐
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Revenue  │ │ Pending  │ │ Overdue  │    │
│  │ ₹3.2L    │ │ ₹1.23L   │ │ ₹45,000  │    │
│  │ ▲12%     │ │ 5 inv.   │ │ 🔴 2 cli │    │
│  └──────────┘ └──────────┘ └──amber/red┘    │
│                                             │
│  ┌─── Revenue Chart ───┐ ┌─ Activity ────┐ │
│  │ ████ ██ ████ ██ ██  │ │ ✓ Paid ₹15k  │ │
│  │ (red bars = overdue) │ │ ⚠ Reminder   │ │
│  │                      │ │ 🔴 Overdue   │ │
│  └──────────────────────┘ └──────────────┘ │
└─────────────────────────────────────────────┘
```

### Pricing
- Currency dropdown (USD/INR) + billing toggle (Monthly/Yearly)
- 3 cards: Free, Pro (highlighted + glow), Growth
- All pricing data from previous spec
- Trust badges below

## Technical Notes
- All content realistic (Indian freelancer context, ₹ amounts)
- Lucide icons throughout
- Mobile-first: all grids → single column on small screens
- Scroll-triggered fade-in animations via Intersection Observer hook
- No external animation libraries — pure CSS + minimal JS
- Parallax disabled on mobile for performance

