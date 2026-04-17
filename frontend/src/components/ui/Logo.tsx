import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

/**
 * Sniply brand mark.
 *
 * The PNG logo (1024×571) has the S icon centred horizontally in the top
 * ~65 % of the image.  We display it in a square container using
 * object-cover + object-position so only the S glyph is visible — then
 * render the wordmark "Sniply" as type alongside it.
 *
 * variant="light"  → white wordmark  (navbar on dark/transparent bg)
 * variant="dark"   → dark wordmark   (navbar on white bg, footer light panels)
 */

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md';
  className?: string;
}

export function Logo({ variant = 'light', size = 'md', className }: LogoProps) {
  const markSize  = size === 'sm' ? 'w-7 h-7'  : 'w-9 h-9';
  const textSize  = size === 'sm' ? 'text-base' : 'text-[1.15rem]';
  const textColor = variant === 'light' ? 'text-white' : 'text-surface-900';

  return (
    <Link to="/" className={cn('flex items-center gap-2.5 group', className)}>
      <motion.div
        whileHover={{ scale: 1.06 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
        className={cn(
          markSize,
          'rounded-xl overflow-hidden shrink-0 ring-1 ring-black/8 shadow-md',
        )}
      >
        {/*
          object-cover fills the square container.
          The image is landscape (1024×571); scaling to container height shows
          the full height but crops the sides.  The S icon sits at roughly
          50 % horizontally and 42 % vertically — object-position centres it.
        */}
        <img
          src="/logo.jpg"
          alt="Sniply logo mark"
          className="w-full h-full object-cover object-[center_35%]"
          draggable={false}
        />
      </motion.div>

      {/* Wordmark */}
      <span className={cn('font-extrabold tracking-tight leading-none select-none', textSize, textColor)}>
        Sniply
      </span>
    </Link>
  );
}
