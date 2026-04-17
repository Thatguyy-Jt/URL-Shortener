import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFound() {
  return (
    <div className="min-h-screen hero-gradient flex flex-col items-center justify-center text-center px-6">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
          className="text-[7rem] font-extrabold text-white/10 leading-none mb-2 select-none"
        >
          404
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
              <Zap size={24} className="text-brand-300" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-3">Page not found</h1>
          <p className="text-white/50 text-base leading-relaxed mb-8">
            The link you followed doesn't exist or may have been moved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/">
              <Button size="lg" className="bg-white text-brand-700 hover:bg-white/90 shadow-none font-bold px-8">
                <ArrowLeft size={16} />
                Back to home
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 border border-white/20 px-8">
                Go to dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
