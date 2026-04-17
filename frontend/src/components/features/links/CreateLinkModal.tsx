import { useState, type FormEvent } from 'react';
import { Link2, Wand2, Calendar, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { useCreateLink } from '../../../hooks/useLinks';
import { getApiError } from '../../../services/api';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateLinkModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateLinkModal({ open, onClose }: CreateLinkModalProps) {
  const createLink = useCreateLink();

  const [url,       setUrl]       = useState('');
  const [slug,      setSlug]      = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState(false);
  const [shortUrl,  setShortUrl]  = useState('');

  function reset() {
    setUrl(''); setSlug(''); setExpiresAt('');
    setError(''); setSuccess(false); setShortUrl('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const link = await createLink.mutateAsync({
        url,
        customSlug: slug.trim() || undefined,
        expiresAt: expiresAt || undefined,
      });
      const base = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SHORT_BASE ?? 'http://localhost:5000';
      setShortUrl(`${base}/${link.slug}`);
      setSuccess(true);
    } catch (err) {
      setError(getApiError(err));
    }
  }

  // Minimum expiry = now + 5 min
  const minExpiry = new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create short link"
      description="Paste a long URL and optionally set a custom slug or expiry."
      size="md"
    >
      <AnimatePresence mode="wait">
        {success ? (
          /* ── Success state ── */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-4"
          >
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-emerald-500" />
              </div>
            </div>
            <h3 className="text-base font-semibold text-surface-900 mb-1">Link created!</h3>
            <p className="text-sm text-surface-500 mb-5">Your short link is ready to share.</p>

            {/* Short URL display */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-50 border border-surface-200 mb-6">
              <code className="flex-1 text-sm text-brand-600 font-mono truncate text-left">
                {shortUrl}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(shortUrl)}
                className="shrink-0 text-xs font-semibold text-brand-500 hover:text-brand-700 transition-colors px-2 py-1 rounded-lg hover:bg-brand-50"
              >
                Copy
              </button>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={reset}>
                Create another
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
          </motion.div>
        ) : (
          /* ── Form state ── */
          <motion.form
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
          >
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                {error}
              </div>
            )}

            <Input
              label="Destination URL"
              type="url"
              placeholder="https://your-very-long-url.com/goes/here"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              leftIcon={<Link2 size={15} />}
              hint="Must start with http:// or https://"
            />

            <Input
              label="Custom slug (optional)"
              type="text"
              placeholder="e.g. summer-sale"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              leftIcon={<Wand2 size={15} />}
              hint="3–50 characters. Letters, numbers and hyphens only."
            />

            <Input
              label="Expiry date (optional)"
              type="datetime-local"
              min={minExpiry}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              leftIcon={<Calendar size={15} />}
              hint="Leave blank for a permanent link."
            />

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                loading={createLink.isPending}
                disabled={!url}
              >
                Shorten link
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </Modal>
  );
}
