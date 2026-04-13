import { Link } from 'react-router-dom';
import { ArrowLeft, LucideIcon } from 'lucide-react';

interface LegalSection {
  title: string;
  body: string[];
}

interface LegalPageLayoutProps {
  icon: LucideIcon;
  label: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

function parseSectionTitle(raw: string) {
  const dotIndex = raw.indexOf('.');
  if (dotIndex === -1) return { num: '', rest: raw };
  return {
    num: raw.slice(0, dotIndex).trim(),
    rest: raw.slice(dotIndex + 1).trim(),
  };
}

export function LegalPageLayout({ icon: Icon, label, title, lastUpdated, intro, sections }: LegalPageLayoutProps) {
  return (
    <main className="min-h-screen bg-[#0A0F0A] text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="mx-auto max-w-[800px] px-6 py-14 md:py-24">

        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/40 transition-colors hover:text-[#84cc16]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>

        {/* Page header */}
        <div className="mt-12 mb-14 pb-10 border-b border-white/8">
          <div className="flex items-center gap-3 mb-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#84cc16]/25 bg-[#84cc16]/10">
              <Icon className="h-5 w-5 text-[#84cc16]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#84cc16]">{label}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4">{title}</h1>
          <p className="text-sm text-white/35 font-medium">Last updated: {lastUpdated}</p>
        </div>

        {/* Intro note */}
        <p className="text-lg text-white/60 leading-[1.85] mb-16">{intro}</p>

        {/* Sections */}
        <div className="space-y-14">
          {sections.map((section) => {
            const { num, rest } = parseSectionTitle(section.title);
            return (
              <div key={section.title} className="grid grid-cols-[3rem_1fr] gap-x-6 gap-y-3 items-start">
                {/* Step number */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#84cc16]/25 bg-[#84cc16]/8 mt-0.5 shrink-0">
                  <span className="text-sm font-bold text-[#84cc16] leading-none">{num}</span>
                </div>

                {/* Content */}
                <div>
                  <h2 className="text-xl font-semibold text-white leading-snug mb-5">{rest}</h2>
                  <div className="space-y-4">
                    {section.body.map((paragraph, i) => (
                      <p key={i} className="text-[15px] text-white/60 leading-[1.85]">{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer divider */}
        <div className="mt-20 pt-8 border-t border-white/8">
          <p className="text-xs text-white/25 font-medium">© {new Date().getFullYear()} PayFlow AI · All rights reserved</p>
        </div>
      </div>
    </main>
  );
}
