import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
}

export function DashboardLayout({ children, title, actions }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?';

  return (
    <div className="min-h-screen" style={{ background: '#f0f2f8' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* ── Top bar ── */}
        <header className="sticky top-0 z-20 h-[60px] bg-white/80 backdrop-blur-md border-b border-black/5 flex items-center justify-between px-5 gap-4 shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-surface-500 hover:text-surface-900 hover:bg-surface-100 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>

            {title && (
              <h1 className="text-[15px] font-semibold text-surface-800 truncate">{title}</h1>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {actions}

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 cursor-default select-none"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              title={user?.name}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* ── Page body ── */}
        <main className="flex-1 p-5 md:p-7 max-w-6xl w-full">{children}</main>
      </div>
    </div>
  );
}
