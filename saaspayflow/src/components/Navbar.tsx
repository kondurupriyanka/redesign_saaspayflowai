import { useState, useEffect, useRef } from 'react';
import { Logo } from './Logo';
import NotificationDropdown from './NotificationDropdown';
import { Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    closeMobileMenu();
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-background/95 backdrop-blur-xl border-b border-transparent shadow-[0_8px_50px_-8px_hsl(84_100%_62%/0.18)]'
        : 'bg-transparent'
    }`}
    style={scrolled ? {
      backgroundImage: 'linear-gradient(to bottom, transparent, transparent calc(100% - 1px), hsl(84 100% 62% / 0.2) calc(100% - 1px), transparent 100%)',
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
    } : {}}>
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center group hover:opacity-80 transition-opacity" onClick={closeMobileMenu}>
          <Logo size="md" />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <button type="button" onClick={() => scrollToSection('features')} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 relative group">
            Features
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/0 group-hover:w-full transition-all duration-300"></span>
          </button>
          <button type="button" onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 relative group">
            How It Works
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/0 group-hover:w-full transition-all duration-300"></span>
          </button>
          <button type="button" onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 relative group">
            Pricing
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/0 group-hover:w-full transition-all duration-300"></span>
          </button>
          <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200 relative group">
            Contact
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-primary/0 group-hover:w-full transition-all duration-300"></span>
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <NotificationDropdown />

          <Link
            to="/auth"
            className="btn-micro bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 hidden sm:inline-block"
          >
            Sign in
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        ref={mobileMenuRef}
        className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
          mobileMenuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="px-6 py-4 space-y-3">
            <button type="button" onClick={() => scrollToSection('features')} className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-left w-full">
              Features
            </button>
            <button type="button" onClick={() => scrollToSection('how-it-works')} className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-left w-full">
              How It Works
            </button>
            <button type="button" onClick={() => scrollToSection('pricing')} className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-left w-full">
              Pricing
            </button>
            <Link
              to="/contact"
              onClick={closeMobileMenu}
              className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/auth"
              onClick={closeMobileMenu}
              className="block text-center bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all duration-200"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
