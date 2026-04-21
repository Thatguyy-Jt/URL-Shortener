import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  /** Page title shown in the top bar */
  title?: string;
  /** Slot for right-side actions in the top bar (e.g. a "Create" button) */
  actions?: ReactNode;
}

export function DashboardLayout({ children, title, actions }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset by sidebar width on desktop */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-16 bg-surface-900 border-b border-white/8 flex items-center justify-between px-6 gap-4 shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile hamburger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/8 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
            </button>

            {title && (
              <h1 className="text-lg font-semibold text-white truncate">{title}</h1>
            )}
          </div>

          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </header>

        {/* Page body */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
