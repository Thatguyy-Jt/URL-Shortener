import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Check, BarChart2, PowerOff, Trash2,
  ExternalLink, AlertTriangle, RefreshCw,
} from 'lucide-react';
import { Badge } from '../../ui/Badge';
import { useDeactivateLink, useDeleteLink } from '../../../hooks/useLinks';
import type { Link } from '../../../types';

const SHORT_BASE =
  (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SHORT_BASE ??
  'http://localhost:5000';

function shortUrl(slug: string) {
  return `${SHORT_BASE}/${slug}`;
}

function truncate(str: string, max = 48) {
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

/* ── Single row ─────────────────────────────────────────────────────────── */

function LinkRow({ link }: { link: Link }) {
  const navigate      = useNavigate();
  const deactivate    = useDeactivateLink();
  const deleteLink    = useDeleteLink();

  const [copied,     setCopied]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const isExpired =
    link.expiresAt != null && new Date(link.expiresAt) < new Date();

  const statusBadge = !link.isActive
    ? <Badge variant="neutral">Inactive</Badge>
    : isExpired
      ? <Badge variant="warning">Expired</Badge>
      : <Badge variant="success">Active</Badge>;

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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="group bg-surface-800 border border-white/8 rounded-2xl px-5 py-4 hover:border-brand-500/30 hover:bg-surface-700 transition-all duration-200"
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">

        {/* Left: URLs + meta */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Short URL row */}
          <div className="flex items-center gap-2">
            <a
              href={shortUrl(link.slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-brand-400 hover:text-brand-300 font-mono flex items-center gap-1 transition-colors"
            >
              {link.slug}
              <ExternalLink size={11} className="opacity-50" />
            </a>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              title="Copy short link"
              className="p-1 rounded-md text-white/30 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
            >
              {copied
                ? <Check size={13} className="text-emerald-500" />
                : <Copy size={13} />
              }
            </button>

            {statusBadge}

            {link.expiresAt && !isExpired && (
              <span className="text-[10px] text-surface-400 hidden sm:inline">
                Expires {new Date(link.expiresAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Original URL */}
          <p
            className="text-xs text-white/35 truncate"
            title={link.originalUrl}
          >
            {truncate(link.originalUrl)}
          </p>
        </div>

        {/* Right: stats + actions */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Clicks */}
          <div className="text-center hidden sm:block">
            <p className="text-lg font-bold text-white leading-none">
              {link.clickCount.toLocaleString()}
            </p>
            <p className="text-[10px] text-white/30 mt-0.5">clicks</p>
          </div>

          {/* Created date */}
          <p className="text-xs text-white/30 hidden md:block w-14 text-right">
            {timeAgo(link.createdAt)}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Analytics */}
            <button
              onClick={() => navigate(`/dashboard/links/${link._id}/analytics`)}
              title="View analytics"
              className="p-2 rounded-xl text-white/30 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
            >
              <BarChart2 size={15} />
            </button>

            {/* Deactivate / Reactivate */}
            <button
              onClick={() => deactivate.mutate(link._id)}
              disabled={deactivate.isPending || !link.isActive}
              title={link.isActive ? 'Deactivate link' : 'Already inactive'}
              className="p-2 rounded-xl text-white/30 hover:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {deactivate.isPending
                ? <RefreshCw size={15} className="animate-spin" />
                : <PowerOff size={15} />
              }
            </button>

            {/* Delete */}
            <AnimatePresence mode="wait">
              {confirmDel ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-xl px-2 py-1"
                >
                  <AlertTriangle size={12} className="text-red-500 shrink-0" />
                  <span className="text-[11px] text-red-600 font-medium">Delete?</span>
                  <button
                    onClick={handleDelete}
                    className="text-[11px] font-bold text-red-600 hover:text-red-700 px-1"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDel(false)}
                    className="text-[11px] text-surface-400 hover:text-surface-600 px-1"
                  >
                    No
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="delete-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setConfirmDel(true)}
                  title="Delete link"
                  className="p-2 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={15} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Skeleton loader ────────────────────────────────────────────────────── */

function LinkSkeleton() {
  return (
    <div className="bg-surface-800 border border-white/8 rounded-2xl px-5 py-4 animate-pulse">
      <div className="flex items-center gap-3">
          <div className="flex-1 space-y-2">
          <div className="h-4 bg-white/8 rounded w-32" />
          <div className="h-3 bg-white/8 rounded w-64" />
        </div>
        <div className="h-8 w-24 bg-white/8 rounded-xl hidden sm:block" />
        <div className="h-8 w-20 bg-white/8 rounded-xl hidden md:block" />
      </div>
    </div>
  );
}

/* ── Table (exported) ───────────────────────────────────────────────────── */

interface LinkTableProps {
  links: Link[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function LinkTable({ links, isLoading, emptyMessage }: LinkTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => <LinkSkeleton key={i} />)}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
          <ExternalLink size={24} className="text-white/20" />
        </div>
        <p className="text-sm font-medium text-white/60 mb-1">
          {emptyMessage ?? 'No links yet'}
        </p>
        <p className="text-sm text-white/30">
          Create your first short link to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {links.map((link) => (
          <LinkRow key={link._id} link={link} />
        ))}
      </AnimatePresence>
    </div>
  );
}
