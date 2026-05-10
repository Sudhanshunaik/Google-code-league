/**
 * Profile Page
 * 
 * Displays user info, skill rating (editable), preferred sports,
 * and a history of their match bookings.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSportMeta } from '../utils/sportsMeta';
import { format } from 'date-fns';
import {
  User, Star, Save, Loader2, Calendar,
  MapPin, CheckCircle, Clock, XCircle, Award
} from 'lucide-react';
import WalletCard from './WalletCard';

export default function Profile({ user, profile, setProfile }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.name || '');
  const [saving, setSaving] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [matches, setMatches] = useState({});

  // Sync local state with profile prop
  useEffect(() => {
    if (profile) {
      setName(profile.name);
    }
  }, [profile]);

  // Fetch user's booking history with match details
  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;

      const { data: bookingData } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingData) {
        setBookings(bookingData);

        // Fetch associated matches
        const matchIds = [...new Set(bookingData.map((b) => b.match_id))];
        if (matchIds.length > 0) {
          const { data: matchData } = await supabase
            .from('matches')
            .select('*')
            .in('id', matchIds);

          if (matchData) {
            const map = {};
            matchData.forEach((m) => { map[m.id] = m; });
            setMatches(map);
          }
        }
      }
    };

    fetchHistory();
  }, [user]);

  // Save profile changes
  const handleSave = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
      setEditing(false);
    }
    setSaving(false);
  };

  const statusIcon = (status) => {
    switch (status) {
      case 'confirmed': return <CheckCircle size={14} className="text-goa-palm" />;
      case 'waitlisted': return <Clock size={14} className="text-goa-sun" />;
      case 'cancelled': return <XCircle size={14} className="text-goa-coral" />;
      default: return null;
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-goa-ocean" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Wallet Card */}
      <WalletCard balance={profile.wallet_balance} />

      {/* Profile Card */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-goa-ocean to-goa-palm flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {profile.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-surface-input border border-border rounded-xl px-3 py-2 text-text-primary text-lg font-bold w-full outline-none focus:border-goa-ocean transition-colors"
              />
            ) : (
              <h1 className="font-display text-2xl font-bold text-text-primary truncate">
                {profile.name}
              </h1>
            )}
            <p className="text-text-secondary text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Skill Rating */}
        <div className="mb-6 bg-surface/30 p-4 rounded-xl border border-white/5">
          <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-3">
            <Star size={14} className="text-goa-sun" />
            Skill Rating
          </label>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-goa-ocean font-bold text-4xl">{profile.skill_rating}</span>
              <span className="text-text-muted text-sm uppercase tracking-wider font-semibold">ELO</span>
            </div>
            
            {(profile.matches_played || 0) < 5 ? (
              <div className="bg-surface border border-white/10 px-3 py-1.5 rounded-full text-text-secondary text-xs font-medium">
                Provisional Rating
              </div>
            ) : (
              <div className="bg-orange-500/10 border border-orange-500/50 shadow-[0_0_15px_rgba(234,88,12,0.2)] px-3 py-1.5 rounded-full text-orange-500 font-bold text-xs flex items-center gap-1.5 animate-pulse-slow">
                <Award size={14} /> Verified Skill
              </div>
            )}
          </div>
          <div className="mt-3 text-xs text-text-muted">
            Matches Played: <span className="font-semibold text-text-primary">{profile.matches_played || 0}</span>
            {((profile.matches_played || 0) < 5) && (
              <span className="ml-1 opacity-70">({5 - (profile.matches_played || 0)} more to verify)</span>
            )}
          </div>
        </div>

        {/* Edit / Save buttons */}
        {editing ? (
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 flex-1">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
            <button onClick={() => { setEditing(false); setName(profile.name); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="btn-secondary w-full flex items-center justify-center gap-2">
            <User size={16} /> Edit Profile
          </button>
        )}
      </div>

      {/* Booking History */}
      <div className="glass rounded-2xl p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-goa-ocean" />
          Match History
        </h2>

        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-muted text-sm mb-3">No matches booked yet.</p>
            <Link to="/" className="btn-primary inline-flex items-center gap-2 text-sm no-underline">
              Find a Match
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((b) => {
              const m = matches[b.match_id];
              if (!m) return null;
              const meta = getSportMeta(m.sport);

              return (
                <Link
                  to={`/match/${m.id}`}
                  key={b.id}
                  className="flex items-center gap-3 bg-surface/50 rounded-xl px-4 py-3 hover:bg-surface-hover transition-colors no-underline"
                >
                  <span className="text-xl">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{m.location}</p>
                    <p className="text-xs text-text-muted">
                      {m.sport} · {m.format} · {format(new Date(m.match_time), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {statusIcon(b.status)}
                    <span className={`text-xs font-medium capitalize ${
                      b.status === 'confirmed' ? 'text-goa-palm' :
                      b.status === 'waitlisted' ? 'text-goa-sun' : 'text-goa-coral'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
