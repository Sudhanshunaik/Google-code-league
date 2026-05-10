/**
 * Auth Page — Login & Signup (Coastal Pulse Design)
 * 
 * Provides email/password auth via Supabase.
 * Auto-creates a profile on signup via the database trigger.
 */
import { useState } from 'react';
import { supabase } from '../lib/supabase';

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
    <div className="min-h-dvh flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="material-symbols-outlined text-6xl text-primary mb-4 block">sports_soccer</span>
          <h1 className="font-display text-4xl font-bold text-primary mb-2 tracking-tight">
            ArenaLink
          </h1>
          <p className="text-on-surface-variant text-base">
            Find matches. Book spots. Play together.
          </p>
        </div>

        {/* Card */}
        <div className="stitch-card p-6 sm:p-8">
          {/* Toggle */}
          <div className="flex rounded-full bg-surface-container p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all border-none cursor-pointer ${
                isLogin
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              Login
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-semibold transition-all border-none cursor-pointer ${
                !isLogin
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 tracking-wider uppercase">Full Name</label>
                <div className="flex items-center gap-2 bg-surface-container rounded-full px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                  <span className="material-symbols-outlined text-[18px] text-outline">person</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required={!isLogin}
                    className="bg-transparent border-none outline-none text-on-surface text-sm flex-1 placeholder:text-outline font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 tracking-wider uppercase">Email</label>
              <div className="flex items-center gap-2 bg-surface-container rounded-full px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-[18px] text-outline">mail</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="bg-transparent border-none outline-none text-on-surface text-sm flex-1 placeholder:text-outline font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 tracking-wider uppercase">Password</label>
              <div className="flex items-center gap-2 bg-surface-container rounded-full px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-[18px] text-outline">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="bg-transparent border-none outline-none text-on-surface text-sm flex-1 placeholder:text-outline font-medium"
                />
              </div>
            </div>

            {error && (
              <div className="bg-error-container border border-error/20 rounded-2xl px-4 py-2.5 text-error text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {message && (
              <div className="bg-primary-container/20 border border-primary/20 rounded-2xl px-4 py-2.5 text-primary text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 mt-2 w-full py-3.5 text-base"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
              ) : isLogin ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">login</span>
                  Login
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">person_add</span>
                  Create Account
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-outline text-xs mt-6">
          Built for Goan athletes 🌴 Google Code League Hackathon
        </p>
      </div>
    </div>
  );
}
