import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';
import { cn } from '../../lib/cn';
import { Link } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how-it-works' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const navBackground = isLanding
    ? scrolled
      ? 'bg-surface-900/95 backdrop-blur-md border-b border-white/10'
      : 'bg-transparent'
    : 'bg-white border-b border-surface-200';

  const linkColor = isLanding ? 'text-white/80 hover:text-white' : 'text-surface-600 hover:text-surface-900';

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 inset-x-0 z-40 transition-all duration-300',
          navBackground,
        )}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Logo variant={isLanding ? 'light' : 'dark'} />

          {/* Desktop nav links */}
          {isLanding && (
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className={cn('text-sm font-medium transition-colors', linkColor)}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button
                variant={isLanding ? 'ghost' : 'outline'}
                size="sm"
                className={isLanding ? 'text-white hover:bg-white/10' : ''}
              >
                Log in
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get started free</Button>
            </Link>
          </div>

          {/* Mobile burger */}
          <button
            className={cn(
              'md:hidden p-2 rounded-lg transition-colors',
              isLanding ? 'text-white hover:bg-white/10' : 'text-surface-700 hover:bg-surface-100',
            )}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <motion.div
        initial={false}
        animate={mobileOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className={cn(
          'fixed inset-x-0 top-16 z-30 md:hidden',
          'bg-surface-900/98 backdrop-blur-md border-b border-white/10',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3">
          {isLanding &&
            NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-white/80 hover:text-white py-2 border-b border-white/10 last:border-0"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
          <div className="flex flex-col gap-2 pt-2">
            <Link to="/login">
              <Button variant="ghost" className="w-full text-white hover:bg-white/10">
                Log in
              </Button>
            </Link>
            <Link to="/register">
              <Button className="w-full">Get started free</Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </>
  );
}
