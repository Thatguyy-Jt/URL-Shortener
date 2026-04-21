import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User as UserIcon } from 'lucide-react';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { getApiError } from '../services/api';

function PasswordStrength({ password }: { password: string }) {
  const score =
    (password.length >= 8 ? 1 : 0) +
    (/[A-Z]/.test(password) ? 1 : 0) +
    (/[0-9]/.test(password) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(password) ? 1 : 0);

  if (!password) return null;

  const label = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][score];
  const colors = [
    'bg-red-400',
    'bg-red-400',
    'bg-amber-400',
    'bg-emerald-400',
    'bg-emerald-500',
  ];

  return (
    <div className="space-y-1">
      <div className="flex gap-1 h-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors duration-300 ${
              i < score ? colors[score] : 'bg-surface-200'
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] text-surface-400">{label}</p>
    </div>
  );
}

export function Register() {
  const { register } = useAuth();
  const navigate      = useNavigate();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const canSubmit = name.trim() && email && password.length >= 8;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await register({ name: name.trim(), email, password });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900 mb-1">Create your account</h1>
        <p className="text-sm text-surface-500">
          Free forever — no credit card required.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          label="Full name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="off"
          leftIcon={<UserIcon size={15} />}
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          leftIcon={<Mail size={15} />}
        />

        <div className="space-y-2">
          <Input
            label="Password"
            type={showPwd ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            leftIcon={<Lock size={15} />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="text-surface-400 hover:text-surface-600 transition-colors"
                aria-label={showPwd ? 'Hide password' : 'Show password'}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />
          <PasswordStrength password={password} />
        </div>

        <p className="text-[11px] text-surface-400 leading-relaxed pt-1">
          By creating an account you agree to our{' '}
          <a href="#" className="text-brand-500 hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="#" className="text-brand-500 hover:underline">Privacy Policy</a>.
        </p>

        <Button
          type="submit"
          size="lg"
          loading={loading}
          disabled={!canSubmit}
          className="w-full mt-1"
        >
          Get started for free
        </Button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-surface-200" />
        <span className="text-xs text-surface-400 font-medium">Already have an account?</span>
        <div className="flex-1 h-px bg-surface-200" />
      </div>

      <Link to="/login">
        <Button variant="outline" size="lg" className="w-full">
          Sign in instead
        </Button>
      </Link>
    </AuthLayout>
  );
}
