import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Link2, Zap, ArrowLeft } from 'lucide-react';
import { Logo } from '../ui/Logo';

const BRAND_BULLETS = [
  { icon: Zap,      text: 'Sub-100ms redirects — your audience never waits.' },
  { icon: Link2,    text: 'Custom slugs — branded, memorable short links.' },
  { icon: BarChart3, text: 'Real-time analytics — every click, every country.' },
];

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">

      {/* ── Left: brand panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] hero-gradient relative overflow-hidden flex-col">
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Logo at top-left */}
        <div className="relative z-10 p-10">
          <Logo variant="light" />
        </div>

        {/* Centre content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-12 pb-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-4">
              Shorten. Track.{' '}
              <span className="text-brand-300">Dominate.</span>
            </h2>
            <p className="text-white/55 text-base leading-relaxed mb-10 max-w-xs">
              The URL shortener built for people who actually care about performance.
            </p>

            <ul className="space-y-5">
              {BRAND_BULLETS.map(({ icon: Icon, text }) => (
                <motion.li
                  key={text}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 w-7 h-7 rounded-lg bg-brand-500/30 border border-brand-400/30 flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-brand-300" />
                  </span>
                  <span className="text-sm text-white/70 leading-relaxed">{text}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom tagline */}
        <div className="relative z-10 px-12 pb-10">
          <p className="text-xs text-white/30">
            Trusted by 50,000+ marketers and developers worldwide.
          </p>
        </div>
      </div>

      {/* ── Right: form panel ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Back to home link */}
        <div className="px-8 pt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-surface-400 hover:text-surface-700 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to home
          </Link>
        </div>

        {/* Centred form */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full max-w-sm"
          >
            {children}
          </motion.div>
        </div>

        {/* Mobile logo at bottom */}
        <div className="lg:hidden px-8 pb-8 flex justify-center">
          <Logo variant="dark" size="sm" />
        </div>
      </div>

    </div>
  );
}
