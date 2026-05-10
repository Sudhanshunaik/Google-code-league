/**
 * Auth Page — Login & Signup
 * 
 * Provides email/password auth via Supabase.
 * Auto-creates a profile on signup via the database trigger.
 */
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, UserPlus, LogIn, Loader2 } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        // Login
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Signup — pass name in metadata so the trigger can use it
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        setMessage('Account created! Check your email to verify, or just log in if email confirmation is disabled.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-5xl mb-4 block">🏖️</span>
          <h1 className="font-display text-3xl font-bold gradient-text mb-2">
            GoaSports
          </h1>
          <p className="text-text-secondary text-sm">
            Find matches. Book spots. Play together.
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-6 sm:p-8">
          {/* Toggle */}
          <div className="flex rounded-xl bg-surface/50 p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all border-none cursor-pointer ${
                isLogin
                  ? 'bg-goa-ocean/20 text-goa-ocean'
                  : 'bg-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <LogIn size={16} /> Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all border-none cursor-pointer ${
                !isLogin
                  ? 'bg-goa-ocean/20 text-goa-ocean'
                  : 'bg-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              <UserPlus size={16} /> Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Full Name</label>
                <div className="flex items-center gap-2 bg-surface-input rounded-xl px-3 py-2.5 border border-border focus-within:border-goa-ocean transition-colors">
                  <UserPlus size={16} className="text-text-muted" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required={!isLogin}
                    className="bg-transparent border-none outline-none text-text-primary text-sm flex-1 placeholder:text-text-muted"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
              <div className="flex items-center gap-2 bg-surface-input rounded-xl px-3 py-2.5 border border-border focus-within:border-goa-ocean transition-colors">
                <Mail size={16} className="text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-transparent border-none outline-none text-text-primary text-sm flex-1 placeholder:text-text-muted"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
              <div className="flex items-center gap-2 bg-surface-input rounded-xl px-3 py-2.5 border border-border focus-within:border-goa-ocean transition-colors">
                <Lock size={16} className="text-text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-transparent border-none outline-none text-text-primary text-sm flex-1 placeholder:text-text-muted"
                />
              </div>
            </div>

            {error && (
              <div className="bg-goa-coral/10 border border-goa-coral/30 rounded-xl px-4 py-2.5 text-goa-coral text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-goa-palm/10 border border-goa-palm/30 rounded-xl px-4 py-2.5 text-goa-palm text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 mt-2 w-full py-3"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isLogin ? (
                <><LogIn size={18} /> Login</>
              ) : (
                <><UserPlus size={18} /> Create Account</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          Built for Goan athletes 🌴 Google Code League Hackathon
        </p>
      </div>
    </div>
  );
}
