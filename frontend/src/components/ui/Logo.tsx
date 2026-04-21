import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

/**
 * Sniplly wordmark logo.
 *
 * Uses Space Grotesk (800 weight) for a distinctive geometric brand feel.
 * variant="light"  → gradient wordmark (on dark backgrounds)
 * variant="dark"   → brand-colored wordmark (on light backgrounds)
 */

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md';
  className?: string;
}

export function Logo({ variant = 'light', size = 'md', className }: LogoProps) {
  const textSize = size === 'sm' ? 'text-xl' : 'text-2xl';

  return (
    <Link to="/" className={cn('group select-none', className)}>
      <motion.span
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800 }}
        className={cn(
          'leading-none tracking-tight inline-block',
          textSize,
          variant === 'light'
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-brand-200 to-brand-400'
            : 'text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400',
        )}
      >
        Sniplly
      </motion.span>
    </Link>
  );
}
