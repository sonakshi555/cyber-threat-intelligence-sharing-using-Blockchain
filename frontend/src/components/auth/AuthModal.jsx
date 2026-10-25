import { useState } from 'react';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertTriangle,
  Building2,
  Globe,
  ShieldAlert,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../ui/overlays';
import { Button, Field, Input } from '../ui/primitives';
import { LogoMark } from '../ui/domain';
import {
  loginWithCredentials,
  registerNewAccount,
  loginWithGoogle,
} from '../../authStore';

export function AuthModal({ open, onClose, onLoginSuccess }) {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'

  // Sign In inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up inputs
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('uploader');
  const [orgName, setOrgName] = useState('');
  const [adminKey, setAdminKey] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Handle Google OAuth
  async function handleGoogleSignIn() {
    setBusy(true);
    setError('');
    const res = await loginWithGoogle();
    setBusy(false);
    if (res.success) {
      onLoginSuccess(res.user);
      onClose();
    } else if (res.cancelled) {
      // User closed popup, do nothing
    } else {
      setError(res.error || 'Google sign-in could not be completed.');
    }
  }

  // Handle Sign In Submit
  async function handleSignInSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide email and password.');
      return;
    }
    setBusy(true);
    setError('');
    const res = await loginWithCredentials(email, password);
    setBusy(false);
    if (res.success) {
      onLoginSuccess(res.user);
      onClose();
    } else {
      setError(res.error || 'Invalid credentials. Please verify your email and password.');
    }
  }

  // Handle Sign Up Submit
  async function handleSignUpSubmit(e) {
    e.preventDefault();
    if (!signupEmail.trim() || !signupPassword.trim()) {
      setError('Email and password are required.');
      return;
    }
    if (signupRole === 'uploader' && !orgName.trim()) {
      setError('Organization name is required for Enterprise SOC role.');
      return;
    }
    if (signupRole === 'admin' && !adminKey.trim()) {
      setError('Admin authorization key is required.');
      return;
    }

    setBusy(true);
    setError('');
    const res = await registerNewAccount({
      name: name.trim() || signupEmail.split('@')[0],
      email: signupEmail.trim(),
      password: signupPassword.trim(),
      role: signupRole,
      organization: signupRole === 'uploader' ? orgName.trim() : 'Decentralized CTI Network',
      adminKey: signupRole === 'admin' ? adminKey.trim() : '',
    });
    setBusy(false);
    if (res.success) {
      onLoginSuccess(res.user);
      onClose();
    } else {
      setError(res.error || 'Failed to create account. Please check your inputs.');
    }
  }

  const fillTestCredentials = (tEmail, tPass) => {
    setTab('signin');
    setEmail(tEmail);
    setPassword(tPass);
    setError('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={tab === 'signin' ? 'Sign in to CTI / ANCHOR' : 'Create an Account'}
      description={
        tab === 'signin'
          ? 'Access decentralized threat intelligence, on-chain consensus, and AI telemetry.'
          : 'Join the decentralized cyber threat intelligence consortium.'
      }
      icon={<LogoMark className="size-8" />}
    >
      <div className="flex flex-col gap-4">
        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-line bg-surface font-medium text-fg transition-all duration-200 hover:border-line-strong hover:bg-elevated disabled:opacity-50"
        >
          <svg className="size-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-sm">Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-1 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-line" />
          </div>
          <span className="relative bg-surface px-3 text-xs uppercase tracking-wider text-subtle font-mono">
            Or with credentials
          </span>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Form */}
        {tab === 'signin' ? (
          <form onSubmit={handleSignInSubmit} className="flex flex-col gap-3.5">
            <Field label="Email Address">
              <Input
                type="email"
                icon={Mail}
                placeholder="operator@enterprise.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field label="Password">
              <Input
                type={showPassword ? 'text' : 'password'}
                icon={Lock}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                trailing={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-subtle hover:text-fg"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                }
              />
            </Field>

            <Button
              type="submit"
              variant="white"
              size="md"
              loading={busy}
              iconRight={ArrowRight}
              className="mt-2 w-full justify-between"
            >
              Sign In
            </Button>

            <div className="mt-1 text-center text-xs text-muted">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('signup');
                  setError('');
                }}
                className="font-medium text-accent hover:underline"
              >
                Sign up
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-3">
            <Field label="Full Name / Operator Alias">
              <Input
                type="text"
                icon={User}
                placeholder="Alice Vance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </Field>

            <Field label="Email Address">
              <Input
                type="email"
                icon={Mail}
                placeholder="alice@security.org"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </Field>

            <Field label="Password (minimum 6 characters)">
              <Input
                type="password"
                icon={Lock}
                placeholder="••••••••"
                value={signupPassword}
                onChange={(e) => setSignupPassword(e.target.value)}
                minLength={6}
                required
              />
            </Field>

            {/* Role Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-fg">Account Role</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSignupRole('uploader')}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center text-xs transition-colors ${
                    signupRole === 'uploader'
                      ? 'border-accent bg-accent/10 text-accent font-semibold'
                      : 'border-line bg-surface text-muted hover:border-line-strong'
                  }`}
                >
                  <Building2 className="size-4" />
                  <span>Enterprise SOC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSignupRole('public')}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center text-xs transition-colors ${
                    signupRole === 'public'
                      ? 'border-accent bg-accent/10 text-accent font-semibold'
                      : 'border-line bg-surface text-muted hover:border-line-strong'
                  }`}
                >
                  <Globe className="size-4" />
                  <span>Public Analyst</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSignupRole('admin')}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border p-2 text-center text-xs transition-colors ${
                    signupRole === 'admin'
                      ? 'border-accent bg-accent/10 text-accent font-semibold'
                      : 'border-line bg-surface text-muted hover:border-line-strong'
                  }`}
                >
                  <ShieldAlert className="size-4" />
                  <span>System Admin</span>
                </button>
              </div>
            </div>

            {signupRole === 'uploader' && (
              <Field label="Organization / Entity Name">
                <Input
                  type="text"
                  icon={Building2}
                  placeholder="Northstar Security Enterprise"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </Field>
            )}

            {signupRole === 'admin' && (
              <Field label="Admin Security Key (CTI-ADMIN-2026)">
                <Input
                  type="text"
                  icon={KeyRound}
                  placeholder="CTI-ADMIN-2026"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  required
                />
              </Field>
            )}

            <Button
              type="submit"
              variant="white"
              size="md"
              loading={busy}
              iconRight={ArrowRight}
              className="mt-2 w-full justify-between"
            >
              Create Account
            </Button>

            <div className="mt-1 text-center text-xs text-muted">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setTab('signin');
                  setError('');
                }}
                className="font-medium text-accent hover:underline"
              >
                Sign in
              </button>
            </div>
          </form>
        )}

        {/* Quick Demo Test Accounts */}
        <div className="mt-2 rounded-xl border border-line bg-elevated/60 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-subtle">
            Quick Evaluation Credentials
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fillTestCredentials('admin@cyberthreat.org', 'admin123')}
              className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              Admin Lead
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials('soc@northstar.security', 'org123')}
              className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              Enterprise SOC
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials('researcher@public.intel', 'public123')}
              className="rounded-lg border border-line bg-surface px-2.5 py-1 text-xs text-muted transition-colors hover:border-line-strong hover:text-fg"
            >
              Public Researcher
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
