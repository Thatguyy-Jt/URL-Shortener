import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, LogOut, X, Settings, Sparkles } from 'lucide-react';
import { Logo } from '../ui/Logo';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/cn';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const NAV = [
  { icon: LayoutDashboard, label: 'My Links', to: '/dashboard' },
  { icon: Settings,        label: 'Settings',  to: '/settings', disabled: true },
];

function NavItem({
  icon: Icon,
  label,
  to,
  disabled,
  onClick,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  to: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/20 cursor-not-allowed select-none">
        <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
          <Icon size={14} />
        </div>
        <span>{label}</span>
        <span className="ml-auto text-[9px] font-bold tracking-widest text-white/15 uppercase bg-white/5 px-2 py-0.5 rounded-full">
          Soon
        </span>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none',
          isActive
            ? 'bg-gradient-to-r from-brand-500/25 to-brand-600/10 text-white border border-brand-500/20'
            : 'text-white/45 hover:text-white/80 hover:bg-white/6',
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className={cn(
            'w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200',
            isActive ? 'bg-brand-500/30' : 'bg-white/6 group-hover:bg-white/10',
          )}>
            <Icon size={14} className={isActive ? 'text-brand-400' : ''} />
          </div>
          <span>{label}</span>
          {isActive && (
            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  const sidebarContent = (
    <div
      className="h-full flex flex-col w-64"
      style={{ background: 'linear-gradient(180deg, #13102b 0%, #0d0b1e 60%, #080712 100%)' }}
    >
      {/* Top accent line */}
      <div className="h-0.5 bg-gradient-to-r from-brand-500 via-violet-500 to-brand-400 shrink-0" />

      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 shrink-0">
        <Logo variant="light" size="sm" />
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors"
          aria-label="Close sidebar"
        >
          <X size={15} />
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/6" />

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-3 text-[9px] font-bold uppercase tracking-[0.15em] text-white/20">
          Menu
        </p>
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} onClick={onClose} />
        ))}
      </nav>

      {/* Upgrade nudge */}
      <div className="mx-3 mb-3">
        <div className="rounded-xl bg-gradient-to-br from-brand-500/15 to-violet-500/10 border border-brand-500/15 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles size={13} className="text-brand-400" />
            <span className="text-xs font-semibold text-white/70">Pro features</span>
          </div>
          <p className="text-[11px] text-white/35 leading-relaxed">
            Custom domains, bulk import & advanced analytics coming soon.
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-white/6" />

      {/* User + logout */}
      <div className="px-3 py-4 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/4 border border-white/6 mb-2">
          {/* Gradient avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 uppercase"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white/85 truncate leading-tight">{user?.name}</p>
            <p className="text-[10px] text-white/35 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-white/35 hover:text-red-400 hover:bg-red-500/8 transition-all duration-150"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop — always visible */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile — animated drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-30 bg-black/70 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -264 }}
              animate={{ x: 0 }}
              exit={{ x: -264 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="lg:hidden fixed inset-y-0 left-0 z-40"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
