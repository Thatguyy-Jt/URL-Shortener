import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import CountUp from 'react-countup';
import {
  BarChart3, Link2, Clock, Zap, ShieldCheck, Globe,
  ArrowRight, CheckCircle2, Copy, Check,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

/* ─── Animation variants ──────────────────────────────────────────────────── */

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: 'easeOut' as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ─── Section: Hero ──────────────────────────────────────────────────────── */

function HeroSection() {
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const fakeShort = 'snip.ly/k7Xm2p';

  function handleCopy() {
    navigator.clipboard.writeText(`https://${fakeShort}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <section className="hero-gradient min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <Badge variant="brand" className="bg-brand-500/20 text-brand-300 border border-brand-500/30 px-4 py-1 text-xs backdrop-blur-sm">
            ✦ Free forever — no credit card required
          </Badge>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight"
        >
          Shorten.{' '}
          <span className="gradient-text">Track.</span>
          <br />
          Dominate.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-6 text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed"
        >
          Turn long, ugly URLs into branded short links — then watch every click in real time. Built for marketers, developers, and teams that care about performance.
        </motion.p>

        {/* URL input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto"
        >
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            placeholder="Paste your long URL here..."
            className="flex-1 h-12 rounded-xl px-4 text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent backdrop-blur-sm transition"
          />
          <Button size="lg" className="shrink-0 h-12">
            Shorten it <ArrowRight size={16} />
          </Button>
        </motion.div>

        {/* Demo output */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-4 flex items-center justify-center gap-3 text-sm text-white/50"
        >
          <span>Your short link:</span>
          <code className="text-brand-300 font-mono">{fakeShort}</code>
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/80 transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </motion.div>

        {/* Trust pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/40"
        >
          {['No credit card', 'Free forever plan', 'Set up in 30 seconds', 'HTTPS by default'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-brand-400" /> {t}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade into next section */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-surface-50 to-transparent" />
    </section>
  );
}

/* ─── Section: Stats ─────────────────────────────────────────────────────── */

const STATS = [
  { value: 10, suffix: 'M+', label: 'Links created' },
  { value: 1,  suffix: 'B+', label: 'Clicks tracked' },
  { value: 50, suffix: 'K+', label: 'Active users' },
  { value: 99.9, suffix: '%', label: 'Uptime SLA', decimals: 1 },
];

function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-16 bg-white border-y border-surface-100">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <div className="text-4xl md:text-5xl font-extrabold text-surface-900">
                {inView ? (
                  <CountUp
                    start={0}
                    end={stat.value}
                    duration={2}
                    decimals={stat.decimals ?? 0}
                    suffix={stat.suffix}
                    useEasing
                  />
                ) : (
                  <span>0{stat.suffix}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-surface-500 font-medium">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Section: Features ──────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Real-time analytics',
    description: 'See every click as it happens. Track countries, devices, browsers, and referral sources with beautiful charts.',
    color: 'text-brand-500',
    bg: 'bg-brand-50',
  },
  {
    icon: Link2,
    title: 'Custom short slugs',
    description: 'Create memorable, branded short links. Use your own slug like /my-product or /summer-sale.',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
  },
  {
    icon: Clock,
    title: 'Link expiry control',
    description: 'Set links to expire on a specific date. Perfect for time-limited campaigns and promotional offers.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Zap,
    title: 'Sub-100ms redirects',
    description: 'Our async processing pipeline means redirects happen in under 100ms — your audience never waits.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by default',
    description: 'Every link is served over HTTPS. JWT-authenticated API. Your data never leaves our secure infrastructure.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
  {
    icon: Globe,
    title: 'Geo & device insights',
    description: 'Understand where your audience comes from and what devices they use — automatically, on every click.',
    color: 'text-sky-500',
    bg: 'bg-sky-50',
  },
];

function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="features" className="py-24 bg-surface-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          ref={ref}
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <motion.p variants={fadeUp} className="text-xs font-semibold tracking-widest uppercase text-brand-500 mb-3">
            Everything you need
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-surface-900 leading-tight">
            Powerful features,{' '}
            <span className="gradient-text">zero complexity</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-surface-500">
            From link creation to deep analytics — everything lives in one clean dashboard.
          </motion.p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.title} variants={fadeUp}>
                <Card hoverable className="h-full">
                  <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                    <Icon size={22} className={feature.color} />
                  </div>
                  <h3 className="text-lg font-semibold text-surface-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-surface-500 leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Section: How it works ──────────────────────────────────────────────── */

const STEPS = [
  { number: '01', title: 'Paste your URL', description: 'Drop any long link into Sniply — no sign-up required to start.' },
  { number: '02', title: 'Customize your slug', description: 'Create a branded alias or let Sniply generate one for you instantly.' },
  { number: '03', title: 'Share your short link', description: 'Share via social, email, QR code — anywhere your audience is.' },
  { number: '04', title: 'Watch clicks roll in', description: 'Open your dashboard and see real-time analytics: countries, devices, trends.' },
];

function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={stagger}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <motion.p variants={fadeUp} className="text-xs font-semibold tracking-widest uppercase text-brand-500 mb-3">
            How it works
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold text-surface-900 leading-tight">
            Up and running in{' '}
            <span className="gradient-text">under a minute</span>
          </motion.h2>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {STEPS.map((step, idx) => (
            <motion.div key={step.number} variants={fadeUp} className="relative">
              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-7 left-[calc(50%+28px)] right-0 h-px bg-gradient-to-r from-brand-200 to-surface-200" />
              )}
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-xl font-bold mb-4 shadow-brand relative z-10">
                  {step.number}
                </div>
                <h3 className="text-base font-semibold text-surface-900 mb-2">{step.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Section: CTA Banner ────────────────────────────────────────────────── */

function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="py-24 bg-surface-50" ref={ref}>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="hero-gradient rounded-3xl p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10">
            <Badge variant="brand" className="bg-white/15 text-white border border-white/20 mb-6">
              Start for free today
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to make your links work harder?
            </h2>
            <p className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of teams already using Sniply to track every click, understand every audience, and optimize every campaign.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register">
                <Button size="lg" className="bg-white text-brand-700 hover:bg-white/90 shadow-none font-bold px-8">
                  Get started — it's free
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="ghost" className="text-white hover:bg-white/10 border border-white/20 px-8">
                  Log in
                </Button>
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/40">
              {['No credit card required', 'Free forever plan', 'Upgrade anytime'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-brand-300" /> {t}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Page assembly ──────────────────────────────────────────────────────── */

export function Landing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
