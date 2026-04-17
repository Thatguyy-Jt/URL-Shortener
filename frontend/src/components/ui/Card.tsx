import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLMotionProps<'div'> {
  hoverable?: boolean;
  glass?: boolean;
  children: React.ReactNode;
}

export function Card({ hoverable = false, glass = false, className, children, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'rounded-2xl border p-6',
        glass
          ? 'bg-white/10 backdrop-blur-md border-white/20 text-white'
          : 'bg-white border-surface-200 shadow-sm',
        hoverable && 'cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
