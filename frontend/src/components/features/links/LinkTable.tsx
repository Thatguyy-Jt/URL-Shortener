import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Check, BarChart2, PowerOff, Trash2,
  ExternalLink, AlertTriangle, RefreshCw, Link2,
} from 'lucide-react';
import { useDeactivateLink, useDeleteLink } from '../../../hooks/useLinks';
import type { Link } from '../../../types';

const SHORT_BASE =
  (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SHORT_BASE ??
  'http://localhost:5000';

function shortUrl(slug: string) {
  return `${SHORT_BASE}/${slug}`;
}

function truncate(str: string, max = 52) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

/* ── Status dot ─────────────────────────────────────────────────────────── */

function StatusDot({ active, expired }: { active: boolean; expired: boolean }) {
  if (!active) return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-surface-400 bg-surface-100 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-surface-300" />
      Inactive
    </span>
  );
  if (expired) return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Expired
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      Active
    </span>
  );
}

/* ── Single row ─────────────────────────────────────────────────────────── */

function LinkRow({ link }: { link: Link }) {
  const navigate   = useNavigate();
  const deactivate = useDeactivateLink();
  const deleteLink = useDeleteLink();

  const [copied,     setCopied]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const isExpired = link.expiresAt != null && new Date(link.expiresAt) < new Date();

  function handleCopy() {
    navigator.clipboard.writeText(shortUrl(link.slug)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDelete() {
    deleteLink.mutate(link._id);
    setConfirmDel(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22 }}
      className="group relative flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-surface-50 transition-colors duration-150"
    >
      {/* Left: icon + URLs */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Link icon */}
        <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
          <Link2 size={13} className="text-brand-400" />
        </div>

        <div className="min-w-0 flex-1">
          {/* Slug row */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={shortUrl(link.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-brand-600 hover:text-brand-700 font-mono flex items-center gap-1 transition-colors leading-none"
            >
              {link.slug}
              <ExternalLink size={10} className="opacity-40" />
            </a>

            <button
              onClick={handleCopy}
              title="Copy short link"
              className="w-5 h-5 rounded-md flex items-center justify-center text-surface-300 hover:text-brand-500 hover:bg-brand-50 transition-colors"
            >
              {copied
                ? <Check size={11} className="text-emerald-500" />
                : <Copy size={11} />}
            </button>

            <StatusDot active={link.isActive} expired={isExpired} />
          </div>

          {/* Original URL */}
          <p className="text-[11px] text-surface-400 mt-1 truncate" title={link.originalUrl}>
            {truncate(link.originalUrl)}
          </p>
        </div>
      </div>

      {/* Right: stats + actions */}
      <div className="flex items-center gap-4 pl-11 sm:pl-0 shrink-0">
        {/* Click count */}
        <div className="text-center hidden sm:block min-w-[48px]">
          <p className="text-base font-bold text-surface-800 leading-none tabular-nums">
            {link.clickCount.toLocaleString()}
          </p>
          <p className="text-[9px] font-semibold uppercase tracking-wide text-surface-300 mt-0.5">clicks</p>
        </div>

        {/* Time */}
        <p className="text-[11px] text-surface-300 hidden md:block w-12 text-right tabular-nums">
          {timeAgo(link.createdAt)}
        </p>

        {/* Actions — always visible on mobile, hover on desktop */}
        <div className="flex items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => navigate(`/dashboard/links/${link._id}/analytics`)}
            title="View analytics"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-brand-500 hover:bg-brand-50 transition-colors"
          >
            <BarChart2 size={13} />
          </button>

          <button
            onClick={() => deactivate.mutate(link._id)}
            disabled={deactivate.isPending || !link.isActive}
            title={link.isActive ? 'Deactivate' : 'Already inactive'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-amber-500 hover:bg-amber-50 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
          >
            {deactivate.isPending
              ? <RefreshCw size={13} className="animate-spin" />
              : <PowerOff size={13} />}
          </button>

          <AnimatePresence mode="wait">
            {confirmDel ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.9, width: 0 }}
                animate={{ opacity: 1, scale: 1, width: 'auto' }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1 bg-red-50 border border-red-100 rounded-lg px-2 py-1 ml-1"
              >
                <AlertTriangle size={10} className="text-red-400 shrink-0" />
                <button onClick={handleDelete} className="text-[10px] font-bold text-red-500 hover:text-red-600 px-0.5">
                  Delete
                </button>
                <span className="text-surface-300 text-[10px]">·</span>
                <button onClick={() => setConfirmDel(false)} className="text-[10px] text-surface-400 hover:text-surface-600 px-0.5">
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="del-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setConfirmDel(true)}
                title="Delete"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────────────── */

function LinkSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
      <div className="w-8 h-8 rounded-lg bg-surface-100 shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3.5 bg-surface-100 rounded w-28" />
        <div className="h-2.5 bg-surface-100 rounded w-56" />
      </div>
      <div className="h-6 w-16 bg-surface-100 rounded-lg hidden sm:block" />
      <div className="h-6 w-20 bg-surface-100 rounded-lg hidden md:block" />
    </div>
  );
}

/* ── Table ──────────────────────────────────────────────────────────────── */

interface LinkTableProps {
  links: Link[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function LinkTable({ links, isLoading, emptyMessage }: LinkTableProps) {
  if (isLoading) {
    return (
      <div className="divide-y divide-surface-100">
        {[1, 2, 3, 4].map((i) => <LinkSkeleton key={i} />)}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 border border-brand-100 flex items-center justify-center mb-4">
          <Link2 size={20} className="text-brand-300" />
        </div>
        <p className="text-sm font-semibold text-surface-700 mb-1">
          {emptyMessage ?? 'No links yet'}
        </p>
        <p className="text-xs text-surface-400">
          Click <span className="font-medium text-brand-500">New link</span> to create your first short URL.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-surface-100">
      <AnimatePresence initial={false}>
        {links.map((link) => (
          <LinkRow key={link._id} link={link} />
        ))}
      </AnimatePresence>
    </div>
  );
}
