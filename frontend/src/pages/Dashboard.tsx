import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Link2, MousePointerClick, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { LinkTable } from '../components/features/links/LinkTable';
import { CreateLinkModal } from '../components/features/links/CreateLinkModal';
import { Button } from '../components/ui/Button';
import { useLinks } from '../hooks/useLinks';
import { useAuth } from '../hooks/useAuth';

/* ── Stat card ───────────────────────────────────────────────────────────── */

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconBg: string;
  iconColor: string;
  delay?: number;
}

function StatCard({ icon: Icon, label, value, sub, iconBg, iconColor, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-surface-800 rounded-2xl border border-white/8 p-5 flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">{label}</p>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

const PAGE_LIMIT = 10;

export function Dashboard() {
  const { user }    = useAuth();
  const [page, setPage]           = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, isLoading, isError } = useLinks(page, PAGE_LIMIT);

  const links       = data?.links       ?? [];
  const total       = data?.total       ?? 0;
  const totalPages  = data?.totalPages  ?? 1;

  const totalClicks  = links.reduce((sum, l) => sum + l.clickCount, 0);
  const activeLinks  = links.filter((l) => l.isActive).length;

  return (
    <DashboardLayout
      title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'there'} 👋`}
      actions={
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Plus size={15} />
          Create link
        </Button>
      }
    >
      {/* ── Stats row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={Link2}
          label="Total links"
          value={total.toLocaleString()}
          sub="across all pages"
          iconBg="bg-brand-500/15"
          iconColor="text-brand-400"
          delay={0}
        />
        <StatCard
          icon={MousePointerClick}
          label="Total clicks"
          value={totalClicks.toLocaleString()}
          sub="on this page"
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
          delay={0.07}
        />
        <StatCard
          icon={Activity}
          label="Active links"
          value={activeLinks.toLocaleString()}
          sub="on this page"
          iconBg="bg-amber-500/15"
          iconColor="text-amber-400"
          delay={0.14}
        />
      </div>

      {/* ── Links section ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Your links</h2>
            {!isLoading && (
              <p className="text-sm text-white/40 mt-0.5">
                {total === 0
                  ? 'No links yet'
                  : `${total} link${total === 1 ? '' : 's'} total`}
              </p>
            )}
          </div>
          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/40">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>

        {isError ? (
          <div className="py-12 text-center text-sm text-red-400">
            Failed to load links. Please refresh the page.
          </div>
        ) : (
          <LinkTable links={links} isLoading={isLoading} />
        )}
      </motion.div>

      {/* ── Create link modal ── */}
      <CreateLinkModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </DashboardLayout>
  );
}
