import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MousePointerClick, Smartphone,
  TrendingUp, AlertCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAnalytics } from '../hooks/useAnalytics';
import type { CountryEntry, DeviceEntry, BrowserEntry } from '../types';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const BRAND_COLORS = ['#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#eef2ff'];

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

function pct(value: number, total: number) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

/* ─── Stat card ──────────────────────────────────────────────────────────── */

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
      className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm flex items-center gap-4"
    >
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={iconColor} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-surface-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-surface-900 leading-none">{value}</p>
        {sub && <p className="text-xs text-surface-400 mt-1 truncate max-w-[140px]">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ─── Custom tooltip ─────────────────────────────────────────────────────── */

function AreaTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-900 text-white text-xs rounded-xl px-3 py-2 shadow-xl">
      <p className="font-semibold mb-0.5">{label && fmt(label)}</p>
      <p className="text-brand-300">{payload[0].value?.toLocaleString()} clicks</p>
    </div>
  );
}

/* ─── Clicks over time chart ─────────────────────────────────────────────── */

function ClicksChart({ data }: { data: { date: string; count: number }[] }) {
  const hasData = data.some((d) => d.count > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-surface-900 mb-5">Clicks over time (30 days)</h3>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <TrendingUp size={28} className="text-surface-200 mb-3" />
          <p className="text-sm text-surface-400">No clicks recorded yet.</p>
          <p className="text-xs text-surface-300 mt-1">Share your link to start tracking.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={fmt}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<AreaTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6366f1"
              strokeWidth={2.5}
              fill="url(#clickGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

/* ─── Breakdown bar chart ────────────────────────────────────────────────── */

function BreakdownChart({
  title,
  data,
  total,
  delay = 0,
}: {
  title: string;
  data: { name: string; count: number }[];
  total: number;
  delay?: number;
}) {
  const top = data.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl border border-surface-200 p-6 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-surface-900 mb-5">{title}</h3>

      {top.length === 0 ? (
        <div className="flex items-center justify-center h-36 text-sm text-surface-300">
          No data yet
        </div>
      ) : (
        <div className="space-y-3">
          {top.map((item, i) => (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-surface-700 font-medium truncate max-w-[60%]">
                  {item.name || 'Unknown'}
                </span>
                <span className="text-surface-400 tabular-nums">
                  {item.count.toLocaleString()} · {pct(item.count, total)}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: pct(item.count, total) }}
                  transition={{ duration: 0.7, delay: delay + i * 0.05, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: BRAND_COLORS[i % BRAND_COLORS.length] }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-20 bg-white rounded-2xl border border-surface-100" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-surface-100" />)}
      </div>
      <div className="h-64 bg-white rounded-2xl border border-surface-100" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-52 bg-white rounded-2xl border border-surface-100" />)}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export function Analytics() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useAnalytics(id);

  // Normalise breakdown arrays to { name, count }
  const countries = (data?.countries ?? []).map((e: CountryEntry) => ({
    name: e.country, count: e.count,
  }));
  const devices = (data?.devices ?? []).map((e: DeviceEntry) => ({
    name: e.device, count: e.count,
  }));
  const browsers = (data?.browsers ?? []).map((e: BrowserEntry) => ({
    name: e.browser, count: e.count,
  }));

  const total     = data?.totalClicks ?? 0;
  const topDevice = devices[0]?.name  ?? '—';
  const peakDay    = data?.clicksOverTime
    .reduce((best, d) => (d.count > best.count ? d : best), { date: '', count: 0 });

  return (
    <DashboardLayout
      title="Analytics"
      actions={
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-900 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to links
        </button>
      }
    >
      {isLoading && <AnalyticsSkeleton />}

      {isError && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle size={32} className="text-red-400 mb-3" />
          <p className="text-sm font-medium text-surface-700 mb-1">Failed to load analytics</p>
          <p className="text-sm text-surface-400">Make sure you own this link and try again.</p>
        </div>
      )}

      {data && (
        <div className="space-y-6 max-w-6xl">

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={MousePointerClick}
              label="Total clicks"
              value={total.toLocaleString()}
              iconBg="bg-brand-50"
              iconColor="text-brand-500"
              delay={0}
            />
            <StatCard
              icon={TrendingUp}
              label="Peak day"
              value={peakDay?.count ?? 0}
              sub={peakDay?.date ? fmt(peakDay.date) : 'No data'}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-500"
              delay={0.06}
            />
            <StatCard
              icon={Smartphone}
              label="Top device"
              value={topDevice}
              sub={devices[0] ? `${devices[0].count} clicks` : undefined}
              iconBg="bg-violet-50"
              iconColor="text-violet-500"
              delay={0.12}
            />
          </div>

          {/* ── Clicks over time ── */}
          <ClicksChart data={data.clicksOverTime} />

          {/* ── Breakdown charts ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BreakdownChart title="Countries"  data={countries} total={total} delay={0.25} />
            <BreakdownChart title="Devices"    data={devices}   total={total} delay={0.30} />
            <BreakdownChart title="Browsers"   data={browsers}  total={total} delay={0.35} />
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}
