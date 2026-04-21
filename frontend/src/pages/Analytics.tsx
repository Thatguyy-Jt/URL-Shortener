import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MousePointerClick, Smartphone,
  TrendingUp, AlertCircle, BarChart3,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useAnalytics } from '../hooks/useAnalytics';
import type { CountryEntry, DeviceEntry, BrowserEntry } from '../types';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const PALETTE = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe'];

function fmt(date: string) {
  return new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
}

function pct(value: number, total: number) {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
}

/* ─── Stat card ─────────────────────────────────────────────────────────── */

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden bg-white rounded-2xl border border-black/5 p-5 shadow-sm"
    >
      <div className={`absolute inset-x-0 top-0 h-[3px] ${gradient}`} />
      <div className="pt-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-surface-400 mb-2">{label}</p>
        <p className="text-3xl font-extrabold text-surface-900 leading-none tracking-tight">{value}</p>
        {sub && <p className="text-xs text-surface-400 mt-1.5">{sub}</p>}
      </div>
      <div className="absolute top-4 right-4 opacity-8">
        <Icon size={28} className="text-surface-200" />
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
    <div className="bg-surface-900 text-white text-xs rounded-xl px-3.5 py-2.5 shadow-2xl border border-white/10">
      <p className="text-white/50 mb-0.5">{label && fmt(label)}</p>
      <p className="font-bold text-brand-300 text-sm">{payload[0].value?.toLocaleString()} clicks</p>
    </div>
  );
}

/* ─── Clicks chart ───────────────────────────────────────────────────────── */

function ClicksChart({ data }: { data: { date: string; count: number }[] }) {
  const hasData = data.some((d) => d.count > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden"
    >
      <div className="px-6 pt-5 pb-4 border-b border-surface-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-surface-900">Click activity</h3>
          <p className="text-[11px] text-surface-400 mt-0.5">Last 30 days</p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center">
          <BarChart3 size={14} className="text-brand-400" />
        </div>
      </div>

      <div className="p-4 pt-5">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-44 text-center">
            <TrendingUp size={28} className="text-surface-200 mb-3" />
            <p className="text-sm font-medium text-surface-400">No clicks yet</p>
            <p className="text-xs text-surface-300 mt-1">Share your link to start tracking.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={fmt}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                interval={5}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<AreaTooltip />}
                cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#areaGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Breakdown chart ────────────────────────────────────────────────────── */

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
      className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden"
    >
      <div className="px-5 pt-4 pb-3 border-b border-surface-100">
        <h3 className="text-sm font-semibold text-surface-900">{title}</h3>
      </div>

      <div className="p-5">
        {top.length === 0 ? (
          <div className="flex items-center justify-center h-28 text-xs text-surface-300">
            No data yet
          </div>
        ) : (
          <div className="space-y-3.5">
            {top.map((item, i) => (
              <div key={item.name}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-surface-700 font-medium truncate max-w-[55%]">
                    {item.name || 'Unknown'}
                  </span>
                  <span className="text-surface-400 tabular-nums text-[11px]">
                    {item.count.toLocaleString()} · <span className="font-semibold text-surface-600">{pct(item.count, total)}</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-100 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: pct(item.count, total) }}
                    transition={{ duration: 0.8, delay: delay + i * 0.06, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-24 bg-white rounded-2xl border border-black/5" />
        ))}
      </div>
      <div className="h-72 bg-white rounded-2xl border border-black/5" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-52 bg-white rounded-2xl border border-black/5" />
        ))}
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export function Analytics() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate    = useNavigate();
  const { data, isLoading, isError } = useAnalytics(id);

  const countries = (data?.countries ?? []).map((e: CountryEntry) => ({ name: e.country, count: e.count }));
  const devices   = (data?.devices   ?? []).map((e: DeviceEntry)  => ({ name: e.device,  count: e.count }));
  const browsers  = (data?.browsers  ?? []).map((e: BrowserEntry) => ({ name: e.browser, count: e.count }));

  const total     = data?.totalClicks ?? 0;
  const topDevice = devices[0]?.name ?? '—';
  const peakDay   = data?.clicksOverTime
    .reduce((best, d) => (d.count > best.count ? d : best), { date: '', count: 0 });

  return (
    <DashboardLayout
      title="Analytics"
      actions={
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-xs font-medium text-surface-500 hover:text-surface-900 bg-white border border-surface-200 rounded-lg px-3 py-1.5 transition-colors"
        >
          <ArrowLeft size={13} />
          Back
        </button>
      }
    >
      {isLoading && <AnalyticsSkeleton />}

      {isError && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
            <AlertCircle size={22} className="text-red-400" />
          </div>
          <p className="text-sm font-semibold text-surface-700 mb-1">Failed to load analytics</p>
          <p className="text-xs text-surface-400">Make sure you own this link and try again.</p>
        </div>
      )}

      {data && (
        <div className="space-y-5 max-w-5xl">

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={MousePointerClick}
              label="Total clicks"
              value={total.toLocaleString()}
              gradient="bg-gradient-to-r from-brand-500 to-violet-500"
              delay={0}
            />
            <StatCard
              icon={TrendingUp}
              label="Peak day"
              value={peakDay?.count ?? 0}
              sub={peakDay?.date ? fmt(peakDay.date) : 'No data'}
              gradient="bg-gradient-to-r from-emerald-400 to-teal-500"
              delay={0.07}
            />
            <StatCard
              icon={Smartphone}
              label="Top device"
              value={topDevice}
              sub={devices[0] ? `${devices[0].count} clicks` : undefined}
              gradient="bg-gradient-to-r from-amber-400 to-orange-500"
              delay={0.14}
            />
          </div>

          {/* ── Clicks over time ── */}
          <ClicksChart data={data.clicksOverTime} />

          {/* ── Breakdowns ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BreakdownChart title="Countries" data={countries} total={total} delay={0.25} />
            <BreakdownChart title="Devices"   data={devices}   total={total} delay={0.30} />
            <BreakdownChart title="Browsers"  data={browsers}  total={total} delay={0.35} />
          </div>

        </div>
      )}
    </DashboardLayout>
  );
}
