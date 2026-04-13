import { Logo } from './Logo';
import { TwitterIcon, LinkedinIcon, GithubIcon, Globe2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export function MinimalFooter() {
        const year = new Date().getFullYear();
        const location = useLocation();
        const navigate = useNavigate();

        const goToSection = (id: string) => {
                if (location.pathname === '/') {
                        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        return;
                }

                navigate(`/#${id}`);
        };

        const product = [
                { title: 'Features', id: 'features' },
                { title: 'How It Works', id: 'how-it-works' },
                { title: 'Pricing', id: 'pricing' },
        ];

        const resources = [
                { title: 'Blog', href: '/contact' },
                { title: 'Help Center', href: '/contact' },
                { title: 'Changelog', href: '/contact' },
        ];

        const legal = [
                { title: 'Privacy Policy', href: '/privacy' },
                { title: 'Terms', href: '/terms' },
                { title: 'Refund Policy', href: '/refund' },
                { title: 'Contact', href: '/contact' },
        ];

        const socialLinks = [
                { icon: <TwitterIcon className="size-4" />, link: '#', label: 'Twitter' },
                { icon: <LinkedinIcon className="size-4" />, link: '#', label: 'LinkedIn' },
                { icon: <GithubIcon className="size-4" />, link: '#', label: 'GitHub' },
        ];

        return (
                <footer className="relative border-t border-border/50 bg-gradient-to-b from-background/50 to-background">
                        <div className="mx-auto max-w-6xl px-6 py-16">
                                <div className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
                                        <div className="space-y-5">
                                                <Logo size="lg" className="scale-[1.02] origin-left" />
                                                <p className="max-w-sm text-[1rem] leading-7 text-muted-foreground">
                                                        Stop chasing payments. Start getting paid.
                                                </p>
                                                <div className="flex flex-wrap items-center gap-3">
                                                        {socialLinks.map((item) => (
                                                                <a
                                                                        key={item.label}
                                                                        href={item.link}
                                                                        aria-label={item.label}
                                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-white/[0.03] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                                                                >
                                                                        {item.icon}
                                                                </a>
                                                        ))}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                        <Globe2 className="h-4 w-4 text-primary" />
                                                        Trusted by freelancers worldwide
                                                </div>
                                        </div>

                                        <div>
                                                <h4 className="caption-lg mb-4 text-foreground">Product</h4>
                                                <ul className="space-y-3">
                                                        {product.map((item) => (
                                                                <li key={item.title}>
                                                                        <button
                                                                                type="button"
                                                                                onClick={() => goToSection(item.id)}
                                                                                className="body-sm text-left text-muted-foreground transition-colors hover:text-foreground"
                                                                        >
                                                                                {item.title}
                                                                        </button>
                                                                </li>
                                                        ))}
                                                </ul>
                                        </div>

                                        <div>
                                                <h4 className="caption-lg mb-4 text-foreground">Resources</h4>
                                                <ul className="space-y-3">
                                                        {resources.map((item) => (
                                                                <li key={item.title}>
                                                                        <Link to={item.href} className="body-sm text-muted-foreground transition-colors hover:text-foreground">
                                                                                {item.title}
                                                                        </Link>
                                                                </li>
                                                        ))}
                                                </ul>
                                        </div>

                                        <div>
                                                <h4 className="caption-lg mb-4 text-foreground">Legal</h4>
                                                <ul className="space-y-3">
                                                        {legal.map((item) => (
                                                                <li key={item.title}>
                                                                        <Link to={item.href} className="body-sm text-muted-foreground transition-colors hover:text-foreground">
                                                                                {item.title}
                                                                        </Link>
                                                                </li>
                                                        ))}
                                                </ul>
                                        </div>
                                </div>

                                <div className="my-10 border-t border-border/50" />

                                <div className="flex flex-col gap-3 text-center text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:text-left">
                                        <p>&copy; {year} PayFlow AI. All rights reserved. | Registered in India</p>
                                        <p className="font-medium text-foreground/80">Payments secured by Paddle</p>
                                        <p>Made with love in Bangalore, India</p>
                                </div>
                        </div>
                </footer>
        );
}
