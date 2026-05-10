/**
 * Profile Page — Stitch Coastal Pulse Design
 * 
 * Displays user info, skill rating (editable), preferred sports,
 * and a history of their match bookings.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSportMeta } from '../utils/sportsMeta';
import { format } from 'date-fns';
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

  const statusConfig = {
    confirmed: { icon: 'check_circle', color: 'text-primary', label: 'Confirmed' },
    waitlisted: { icon: 'schedule', color: 'text-tertiary', label: 'Waitlisted' },
    cancelled: { icon: 'cancel', color: 'text-error', label: 'Cancelled' },
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <span className="material-symbols-outlined text-4xl text-primary animate-pulse">person</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
      {/* Profile Header Card */}
      <div className="stitch-card p-6 sm:p-8 mb-4">
        <div className="flex items-center gap-4 mb-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-on-primary text-3xl font-bold flex-shrink-0 shadow-md">
            {profile.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-surface-container border border-transparent focus:border-primary rounded-full px-4 py-2 text-on-surface text-lg font-bold w-full outline-none transition-colors"
              />
            ) : (
              <h1 className="font-display text-2xl font-bold text-on-surface truncate">
                {profile.name}
              </h1>
            )}
            <p className="text-on-surface-variant text-sm">{user?.email}</p>
            {/* Membership Tier Badge */}
            <div className="inline-flex items-center gap-1 mt-1 px-3 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
              <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
              {profile.tier || 'Pro'} Tier
            </div>
          </div>
        </div>

        {/* Edit / Save buttons */}
        {editing ? (
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 flex-1 justify-center">
              {saving ? (
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">save</span>
              )}
              Save Changes
            </button>
            <button onClick={() => { setEditing(false); setName(profile.name); }} className="btn-secondary">
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="btn-secondary w-full flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Edit Profile
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* ELO Rating */}
        <div className="stitch-card p-4 text-center">
          <span className="material-symbols-outlined text-primary text-[28px] mb-1 block">military_tech</span>
          <p className="font-display text-2xl font-bold text-on-surface">{profile.skill_rating || 1200}</p>
          <p className="text-xs text-on-surface-variant font-semibold tracking-wider uppercase">ELO</p>
          {(profile.matches_played || 0) >= 5 ? (
            <div className="mt-2 inline-flex items-center gap-1 bg-tertiary-fixed text-on-surface px-2 py-0.5 rounded-full text-[10px] font-bold">
              <span className="material-symbols-outlined text-[12px]">verified</span>
              Verified
            </div>
          ) : (
            <p className="text-[10px] text-outline mt-1">{5 - (profile.matches_played || 0)} more to verify</p>
          )}
        </div>

        {/* Matches Played */}
        <div className="stitch-card p-4 text-center">
          <span className="material-symbols-outlined text-secondary text-[28px] mb-1 block">scoreboard</span>
          <p className="font-display text-2xl font-bold text-on-surface">{profile.matches_played || 0}</p>
          <p className="text-xs text-on-surface-variant font-semibold tracking-wider uppercase">Played</p>
        </div>

        {/* Win Rate */}
        <div className="stitch-card p-4 text-center">
          <span className="material-symbols-outlined text-tertiary text-[28px] mb-1 block">trending_up</span>
          <p className="font-display text-2xl font-bold text-on-surface">{profile.win_rate || '—'}%</p>
          <p className="text-xs text-on-surface-variant font-semibold tracking-wider uppercase">Win Rate</p>
        </div>
      </div>

      {/* Wallet Card */}
      <WalletCard
        balance={profile.wallet_balance}
        userId={user.id}
        onBalanceUpdate={(newBalance) => setProfile({ ...profile, wallet_balance: newBalance })}
      />

      {/* Booking History */}
      <div className="stitch-card p-6 sm:p-8 mt-4">
        <h2 className="font-display text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">history</span>
          Match History
        </h2>

        {bookings.length === 0 ? (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-4xl text-outline-variant mb-2 block">sports_score</span>
            <p className="text-on-surface-variant text-sm mb-3">No matches booked yet.</p>
            <Link to="/" className="btn-primary inline-flex items-center gap-2 text-sm no-underline">
              <span className="material-symbols-outlined text-[16px]">search</span>
              Find a Match
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {bookings.map((b) => {
              const m = matches[b.match_id];
              if (!m) return null;
              const meta = getSportMeta(m.sport);
              const status = statusConfig[b.status] || statusConfig.confirmed;

              return (
                <Link
                  to={`/match/${m.id}`}
                  key={b.id}
                  className="flex items-center gap-3 bg-surface-low rounded-2xl px-4 py-3 hover:bg-surface-container transition-colors no-underline"
                >
                  <span className="material-symbols-outlined text-[24px]" style={{ color: meta.color }}>{meta.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-on-surface truncate">{m.location}</p>
                    <p className="text-xs text-on-surface-variant">
                      {m.sport} · {m.format} · {format(new Date(m.match_time), 'MMM d, h:mm a')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`material-symbols-outlined text-[16px] ${status.color}`}>{status.icon}</span>
                    <span className={`text-xs font-semibold capitalize ${status.color}`}>
                      {status.label}
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
