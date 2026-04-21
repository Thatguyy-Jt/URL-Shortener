import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Link2, MousePointerClick, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LinkTable } from '../components/features/links/LinkTable';
import { CreateLinkModal } from '../components/features/links/CreateLinkModal';
import { Button } from '../components/ui/Button';
import { useLinks } from '../hooks/useLinks';
import { useAuth } from '../hooks/useAuth';

/* ── Stat card ─────────────────────────────────────────────────────────────── */

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  gradient: string;
  delay?: number;
}

function StatCard({ icon: Icon, label, value, sub, gradient, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className="relative overflow-hidden bg-white rounded-2xl border border-black/5 p-5 shadow-sm"
    >
      {/* Colored top line */}
      <div className={`absolute inset-x-0 top-0 h-[3px] ${gradient}`} />

      <div className="flex items-start justify-between gap-3 pt-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-surface-400 mb-2">
            {label}
          </p>
          <p className="text-3xl font-extrabold text-surface-900 leading-none tracking-tight">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-surface-400 mt-1.5">{sub}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl ${gradient} flex items-center justify-center shrink-0 opacity-15`}>
          <Icon size={20} className="text-white" />
        </div>
      </div>

      {/* Icon overlay for contrast */}
      <div className="absolute top-4 right-4">
        <Icon size={18} className="text-surface-300" />
      </div>
    </motion.div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

const PAGE_LIMIT = 10;

export function Dashboard() {
  const { user }    = useAuth();
  const [page, setPage]           = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isError } = useLinks(page, PAGE_LIMIT);

  const links      = data?.links      ?? [];
  const total      = data?.total      ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const totalClicks = links.reduce((sum, l) => sum + l.clickCount, 0);
  const activeLinks = links.filter((l) => l.isActive).length;

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <DashboardLayout
      title="Dashboard"
      actions={
        <Button onClick={() => setModalOpen(true)} size="sm" className="gap-1.5">
          <Plus size={14} />
          New link
        </Button>
      }
    >
      {/* ── Greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <h2 className="text-xl font-bold text-surface-900">
          Good {greeting()}, {firstName}
        </h2>
        <p className="text-sm text-surface-400 mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Link2}
          label="Total links"
          value={total.toLocaleString()}
          sub="across all pages"
          gradient="bg-gradient-to-r from-brand-500 to-violet-500"
          delay={0}
        />
        <StatCard
          icon={MousePointerClick}
          label="Clicks"
          value={totalClicks.toLocaleString()}
          sub="on this page"
          gradient="bg-gradient-to-r from-emerald-400 to-teal-500"
          delay={0.07}
        />
        <StatCard
          icon={Activity}
          label="Active links"
          value={activeLinks.toLocaleString()}
          sub="on this page"
          gradient="bg-gradient-to-r from-amber-400 to-orange-500"
          delay={0.14}
        />
      </div>

      {/* ── Links section ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
        className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden"
      >
        {/* Section header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-surface-900">Your links</h2>
            {!isLoading && total > 0 && (
              <span className="text-xs font-medium text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">
                {total}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <>
                <span className="text-xs text-surface-400 mr-1">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-700 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-700 hover:bg-surface-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Table body */}
        <div className="p-2">
          {isError ? (
            <div className="py-14 text-center text-sm text-red-400">
              Failed to load links. Please refresh.
            </div>
          ) : (
            <LinkTable links={links} isLoading={isLoading} />
          )}
        </div>
      </motion.div>

      <CreateLinkModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </DashboardLayout>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}
