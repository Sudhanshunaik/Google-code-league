/**
 * App.jsx — Root Component
 * 
 * Handles:
 * - Supabase auth state (session listener)
 * - Profile fetching
 * - Route definitions
 * - Layout with Navbar
 */
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

import Navbar from './components/Navbar';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import MatchDetail from './components/MatchDetail';
import Profile from './components/Profile';
import TournamentUploader from './components/TournamentUploader';
import TournamentMap from './components/TournamentMap';

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  // Listen for auth state changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch profile when session changes
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.user) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!error && data) {
        setProfile(data);
      }
    };

    fetchProfile();
  }, [session]);

  // Listen for realtime profile changes (specifically wallet_balance)
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel(`public:profiles:id=eq.${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}`,
        },
        (payload) => {
          const newProfile = payload.new;
          if (newProfile.wallet_balance > profile.wallet_balance) {
            const diff = newProfile.wallet_balance - profile.wallet_balance;
            setToastMessage(`You just earned ₹${diff} from a late cancellation!`);
            setTimeout(() => setToastMessage(null), 5000);
          }
          setProfile(newProfile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <span className="text-4xl block mb-3">🏖️</span>
          <div className="skeleton h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  const user = session?.user || null;

  return (
    <BrowserRouter>
      {/* Navbar (only shown when logged in) */}
      {user && <Navbar user={user} profile={profile} />}

      {/* Main content (offset for fixed navbar) */}
      <main className={user ? 'pt-16 flex-1' : 'flex-1'}>
        <Routes>
          {/* Auth */}
          <Route
            path="/auth"
            element={user ? <Navigate to="/" replace /> : <Auth />}
          />

          {/* Dashboard */}
          <Route
            path="/"
            element={user ? <Dashboard /> : <Navigate to="/auth" replace />}
          />

          {/* Match Detail */}
          <Route
            path="/match/:id"
            element={user ? <MatchDetail user={user} profile={profile} /> : <Navigate to="/auth" replace />}
          />

          {/* Tournament Features */}
          <Route
            path="/upload-tournament"
            element={user ? <TournamentUploader /> : <Navigate to="/auth" replace />}
          />
          <Route
            path="/map"
            element={user ? <TournamentMap /> : <Navigate to="/auth" replace />}
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={
              user ? (
                <Profile user={user} profile={profile} setProfile={setProfile} />
              ) : (
                <Navigate to="/auth" replace />
              )
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      {user && (
        <footer className="text-center py-4 text-text-muted text-xs border-t border-border">
          🌴 GoaSports — Built for Google Code League Hackathon 2026
        </footer>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-goa-ocean/20 border border-goa-ocean/50 backdrop-blur-md text-goa-ocean px-6 py-3 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎉</span>
            <span className="font-semibold text-sm">{toastMessage}</span>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}
