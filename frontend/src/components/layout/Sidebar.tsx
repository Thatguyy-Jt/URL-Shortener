import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, LogOut, X, Settings, ChevronRight } from 'lucide-react';
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
  const base =
    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 select-none';

  if (disabled) {
    return (
      <div className={cn(base, 'text-white/25 cursor-not-allowed')}>
        <Icon size={17} />
        <span>{label}</span>
        <span className="ml-auto text-[10px] font-semibold tracking-wide text-white/20 uppercase">Soon</span>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          base,
          isActive
            ? 'bg-brand-500/20 text-white'
            : 'text-white/55 hover:text-white hover:bg-white/8',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={17} className={isActive ? 'text-brand-400' : ''} />
          <span>{label}</span>
          {isActive && <ChevronRight size={13} className="ml-auto text-brand-400" />}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  const sidebarContent = (
    <div className="h-full flex flex-col bg-surface-900 w-64">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/8 shrink-0">
        <Logo variant="light" size="sm" />
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className="px-3 mb-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
          Navigation
        </p>
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} onClick={onClose} />
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 pb-4 border-t border-white/8 pt-4 shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 mb-2">
          {/* Avatar initials */}
          <div className="w-8 h-8 rounded-full bg-brand-500/30 border border-brand-500/40 flex items-center justify-center text-xs font-bold text-brand-300 shrink-0 uppercase">
            {user?.name?.charAt(0) ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-[11px] text-white/40 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 font-medium"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop — always visible */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile — animated drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
              onClick={onClose}
            />
            {/* Drawer */}
            <motion.aside
              key="drawer"
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed inset-y-0 left-0 z-40 shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
