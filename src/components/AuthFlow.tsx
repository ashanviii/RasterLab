import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LoaderCircle, Sparkles } from 'lucide-react';
import { login, loginWithGoogle, recover, register, updatePassword, type AuthSession } from '../lib/auth';

interface Props {
  onAuthenticate: (session: AuthSession) => void;
  initialView?: AuthView;
  onPasswordUpdated?: () => void;
}

export type AuthView = 'login' | 'signup' | 'recovery' | 'update-password';

const copy = {
  login: {
    eyebrow: 'Welcome back',
    title: 'Where pixels\ncome alive.',
    description: 'Sign in to continue shaping images, textures, and ideas.',
  },
  signup: {
    eyebrow: 'Create an account',
    title: 'Make something\nworth seeing.',
    description: 'Start a new workspace and keep every experiment within reach.',
  },
  recovery: {
    eyebrow: 'Reset your password',
    title: 'Find your way\nback in.',
    description: "Enter your email and we'll prepare a recovery link for you.",
  },
  'update-password': {
    eyebrow: 'Choose a new password',
    title: 'Secure your\nworkspace.',
    description: 'Create a fresh password for your Stencil account.',
  },
} satisfies Record<AuthView, { eyebrow: string; title: string; description: string }>;

export default function AuthFlow({ onAuthenticate, initialView = 'login', onPasswordUpdated }: Props) {
  const [view, setView] = useState<AuthView>(initialView);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeCopy = copy[view];

  function changeView(nextView: AuthView) {
    setView(nextView);
    setError('');
    setSuccessMessage(null);
    setPassword('');
    setConfirmPassword('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (view !== 'update-password' && (!email.trim() || !email.includes('@'))) {
      setError('Enter a valid email address.');
      return;
    }

    if (view === 'recovery') {
      setIsSubmitting(true);
      try {
        await recover(email.trim());
        setSuccessMessage(`If an account exists for ${email.trim()}, a recovery link is on its way.`);
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Could not start password recovery.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (view === 'signup' && !name.trim()) {
      setError('Tell us what we should call you.');
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (view === 'update-password') {
      if (password !== confirmPassword) {
        setError('The passwords do not match.');
        return;
      }
      setIsSubmitting(true);
      try {
        await updatePassword(password);
        onPasswordUpdated?.();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Could not update your password.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (view === 'signup' && !acceptedTerms) {
      setError('Please accept the terms to create your account.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (view === 'signup') {
        const result = await register({ name: name.trim(), email: email.trim(), password });
        if (result.user) onAuthenticate(result.user);
        else if (result.confirmationRequired) {
          setSuccessMessage(`We sent a confirmation link to ${email.trim()}. Open it to finish creating your account.`);
        }
      } else {
        onAuthenticate(await login({ email: email.trim(), password }));
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not sign in.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Google sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-label="Stencil authentication">
        <div className="auth-art" aria-hidden="true">
          <img src="/auth-landscape.jpg" alt="" />
          <div className="auth-art-shade" />
          <div className="auth-art-brand">
            <span className="auth-brand-mark"><Sparkles size={18} strokeWidth={1.8} /></span>
            <span>Stencil</span>
          </div>
          <div className="auth-art-caption">
            <span>01 / 03</span>
            <p>Turn ordinary images into living fields of colour.</p>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-panel-inner">
            {view !== 'login' && view !== 'update-password' ? (
              <button className="auth-back" type="button" onClick={() => changeView('login')}>
                <ArrowLeft size={15} /> Back to login
              </button>
            ) : (
              <span className="auth-back auth-back-placeholder">Stencil workspace</span>
            )}

            <div className="auth-copy" key={view}>
              <p className="auth-eyebrow">{activeCopy.eyebrow}</p>
              <h1>{activeCopy.title.split('\n').map((line) => <span key={line}>{line}</span>)}</h1>
              <p className="auth-description">{activeCopy.description}</p>
            </div>

            {successMessage ? (
              <div className="auth-success" role="status">
                <span><Check size={22} /></span>
                <h2>Check your inbox</h2>
                <p>{successMessage}</p>
                <button type="button" onClick={() => changeView('login')}>Return to login</button>
              </div>
            ) : (
              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                {view !== 'recovery' && view !== 'update-password' && (
                  <>
                    <div className="auth-google">
                      <button type="button" className="auth-google-button" onClick={() => void handleGoogleLogin()} disabled={isSubmitting}>
                        <span>G</span> {view === 'signup' ? 'Sign up with Google' : 'Continue with Google'}
                      </button>
                    </div>
                    {view === 'login' && (
                      <p className="auth-google-note">New to Stencil? Continuing creates your account automatically.</p>
                    )}
                    <div className="auth-divider"><span>or continue with email</span></div>
                  </>
                )}

                {view === 'signup' && (
                  <label className="auth-field">
                    <span>Name</span>
                    <input
                      type="text"
                      autoComplete="name"
                      placeholder="Your name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </label>
                )}

                {view !== 'update-password' && (
                  <label className="auth-field">
                    <span>Email</span>
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                )}

                {view !== 'recovery' && (
                  <label className="auth-field">
                    <span>Password</span>
                    <span className="auth-password-wrap">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((current) => !current)}
                      >
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </span>
                  </label>
                )}

                {view === 'update-password' && (
                  <label className="auth-field">
                    <span>Confirm password</span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Enter it once more"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </label>
                )}

                {view === 'login' && (
                  <div className="auth-form-row">
                    <span className="auth-session-note">Session stays signed in</span>
                    <button className="auth-link" type="button" onClick={() => changeView('recovery')}>
                      Forgot password?
                    </button>
                  </div>
                )}

                {view === 'signup' && (
                  <label className="auth-checkbox auth-terms">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                    />
                    <span className="auth-checkbox-box"><Check size={11} /></span>
                    I agree to the Terms and Privacy Policy
                  </label>
                )}

                {error && <p className="auth-error" role="alert">{error}</p>}

                <button className="auth-submit" type="submit" disabled={isSubmitting}>
                  <span>{view === 'login' ? 'Enter Stencil' : view === 'signup' ? 'Create account' : view === 'recovery' ? 'Send recovery link' : 'Save new password'}</span>
                  {isSubmitting ? <LoaderCircle className="auth-spinner" size={17} /> : <ArrowRight size={17} />}
                </button>

                {view !== 'update-password' && <p className="auth-switch">
                  {view === 'login' ? "Don't have an account?" : view === 'signup' ? 'Already have an account?' : 'Remembered your password?'}{' '}
                  <button type="button" onClick={() => changeView(view === 'login' ? 'signup' : 'login')}>
                    {view === 'login' ? 'Sign up' : 'Log in'}
                  </button>
                </p>}
              </form>
            )}

            <div className="auth-footer">
              <span className="auth-mini-mark"><Sparkles size={13} /></span>
              <strong>Stencil</strong>
              <span>Creative tools for images in motion.</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
