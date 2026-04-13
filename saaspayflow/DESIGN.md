# PayFlow AI — Design System

## 1. Visual theme

Dark fintech dashboard with calm green accents.
Clean, minimal, high trust.
No visual noise. No clutter.

---

## 2. Colors

| Role             | Value     |
|------------------|-----------|
| Background       | `#0B0F0C` |
| Surface          | `#111714` |
| Card             | `#151C18` |
| Primary          | `#7CFF5B` |
| Primary hover    | `#6BE94F` |
| Text primary     | `#E6F1EC` |
| Text secondary   | `#9FB0A5` |
| Muted            | `#6B7C73` |
| Error            | `#FF5C5C` |
| Warning          | `#FFA726` |

---

## 3. Typography

**Font:** Inter

### Hierarchy

| Level    | Size   | Weight    | Usage                      |
|----------|--------|-----------|----------------------------|
| H1       | 32px   | Bold      | Page titles                |
| H2       | 24px   | Semibold  | Section headings           |
| H3       | 18px   | Medium    | Card titles, group labels  |
| Body     | 14px   | Regular   | General content            |
| Label    | 12px   | Semibold  | Small labels, badges       |

### Rules

- **No ALL CAPS** except for small plan badge labels (e.g. "PRO", "FREE")
- Use **sentence case** for all text (capitalize first word only)
- Keep sentences short — one idea per line
- Descriptions: max 2 lines, muted color, smaller than heading
- Add at least `mb-2` or `mt-2` spacing between heading and its description

---

## 4. Components

### Buttons

- **Primary:** green background (`bg-primary`), `rounded-xl`, no heavy shadows
- **Secondary:** outline border, muted background on hover
- **Destructive:** red background, used sparingly

### Cards

- `rounded-xl`
- Soft border: `border-[#1F2A24]` or `border-white/[0.07]`
- Padding: `p-4` (16px) to `p-6` (24px)
- Minimal depth — no heavy drop shadows

### Sidebar

- Fixed width: `w-60` (240px)
- Icon (17px) + label (`text-[13.5px] font-medium`)
- Active item: green tinted bg + green dot indicator
- No all-caps nav labels

### Section labels (above headings)

- Class: `caption-lg text-primary`
- Size: 13px, semibold
- Sentence case — e.g. "How it works", not "HOW IT WORKS"
- Slight letter-spacing: `0.02em`

### Stat cards (dashboard)

- Label: `caption-md text-muted-foreground` — sentence case
- Value: `text-3xl font-bold`
- Sub-note: `text-xs`

---

## 5. Layout

### Spacing scale

`8px · 12px · 16px · 24px · 32px · 48px · 64px`

### Grid

- Max content width: `max-w-6xl` (1200px)
- Sidebar: fixed `w-60`
- Consistent horizontal padding: `px-5` or `px-6`

---

## 6. Do NOT

- No ALL CAPS except plan badge labels
- No cluttered UI — one focal point per section
- No more than 2 lines of description text
- No random font sizes — use the hierarchy table
- No misalignment — everything on the grid
- No heavy glows or neon effects
- No decorative circles around logo icons

---

## 7. UX rules

- Always show the user what to do next
- Empty states must include a clear CTA
- Loading states must be visible (skeleton or spinner)
- Errors must be specific, not generic

---

## 8. Dashboard behavior

- Show real data from backend
- If empty → show an action prompt (e.g. "Create your first invoice")
- Highlight money-related numbers clearly (larger font, primary or warning color)
- Overdue amounts get the error/warning color

---

## 9. Tone

- Simple
- Direct
- Financial clarity
- No buzzwords or marketing fluff
- Short sentences, active voice
