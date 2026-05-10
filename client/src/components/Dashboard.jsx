/**
 * Dashboard — Home Dashboard (Stitch Coastal Pulse Design)
 * 
 * Shows welcome hero, upcoming matches as cards with venue images,
 * sport filter chips, and quick actions.
 * Subscribes to Supabase Realtime for live booking counts.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSportMeta } from '../utils/sportsMeta';
import { getMatchWeather } from '../utils/weather';
import { format } from 'date-fns';

export default function Dashboard({ profile }) {
  const [matches, setMatches] = useState([]);
  const [bookingCounts, setBookingCounts] = useState({});
  const [matchWeather, setMatchWeather] = useState({});
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState('All');

  // Fetch all upcoming matches
  useEffect(() => {
    const fetchMatches = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .in('status', ['upcoming', 'live'])
        .order('match_time', { ascending: true });

      if (!error && data) {
        setMatches(data);
        
        // Fetch weather for all matches
        const weatherData = {};
        await Promise.all(data.map(async (m) => {
          const weather = await getMatchWeather(m.latitude, m.longitude, m.match_time);
          weatherData[m.id] = weather;
        }));
        setMatchWeather(weatherData);
      }
      setLoading(false);
    };

    fetchMatches();
  }, []);

  // Fetch booking counts for each match
  useEffect(() => {
    const fetchCounts = async () => {
      if (matches.length === 0) return;

      const matchIds = matches.map((m) => m.id);

      const { data, error } = await supabase
        .from('bookings')
        .select('match_id, status')
        .in('match_id', matchIds)
        .in('status', ['confirmed', 'waitlisted']);

      if (!error && data) {
        const counts = {};
        data.forEach((b) => {
          if (!counts[b.match_id]) counts[b.match_id] = { confirmed: 0, waitlisted: 0 };
          counts[b.match_id][b.status]++;
        });
        setBookingCounts(counts);
      }
    };

    fetchCounts();

    // Subscribe to realtime changes on bookings table
    const channel = supabase
      .channel('dashboard-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          // Re-fetch counts on any booking change
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matches]);

  // Get unique sports for filter
  const sports = ['All', ...new Set(matches.map((m) => m.sport))];

  // Apply filter
  const filtered = sportFilter === 'All'
    ? matches
    : matches.filter((m) => m.sport === sportFilter);

  const displayName = profile?.display_name || 'Player';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <span className="material-symbols-outlined text-4xl text-primary animate-pulse">sports_soccer</span>
          <p className="text-on-surface-variant text-sm mt-2">Loading matches…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-6">
      {/* Welcome Hero */}
      <div className="mb-8">
        <h2 className="font-display text-2xl md:text-[32px] font-semibold text-on-surface leading-tight mb-1">
          Welcome back, <span className="text-primary">{displayName}</span>
        </h2>
        <p className="text-on-surface-variant text-base md:text-lg">
          Ready to hit the court?
        </p>
      </div>

      {/* Quick Stats (Stitch-style horizontal cards) */}
      {profile && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {/* ELO Rating */}
          <div className="stitch-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary text-[20px]">military_tech</span>
              <span className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">ELO</span>
            </div>
            <p className="font-display text-2xl font-bold text-on-surface">{profile.skill_rating || 1200}</p>
          </div>

          {/* Wallet */}
          <div className="stitch-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-tertiary text-[20px]">account_balance_wallet</span>
              <span className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">Wallet</span>
            </div>
            <p className="font-display text-2xl font-bold text-on-surface">₹{profile.wallet_balance || 0}</p>
          </div>

          {/* Matches Count */}
          <div className="stitch-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">scoreboard</span>
              <span className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">Matches</span>
            </div>
            <p className="font-display text-2xl font-bold text-on-surface">{matches.length}</p>
          </div>

          {/* Status */}
          <div className="stitch-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary-container text-[20px]">verified</span>
              <span className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">Tier</span>
            </div>
            <p className="font-display text-lg font-bold text-primary">{profile.tier || 'Pro'}</p>
          </div>
        </div>
      )}

      {/* Section Title */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-semibold text-on-surface">Upcoming Matches</h3>
        <Link to="/map" className="text-primary text-sm font-semibold no-underline flex items-center gap-1 hover:underline">
          View Map
          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
        </Link>
      </div>

      {/* Sport Filter Chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {sports.map((sport) => {
          const meta = sport !== 'All' ? getSportMeta(sport) : null;
          const isActive = sportFilter === sport;
          return (
            <button
              key={sport}
              onClick={() => setSportFilter(sport)}
              className={`sport-chip ${isActive ? 'sport-chip--active' : 'sport-chip--inactive'}`}
            >
              {meta && <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>}
              {sport === 'All' ? 'All Sports' : sport}
            </button>
          );
        })}
      </div>

      {/* Matches Grid */}
      {filtered.length === 0 ? (
        <div className="stitch-card p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-3 block">search_off</span>
          <p className="text-on-surface-variant">No matches found. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((match) => {
            const meta = getSportMeta(match.sport);
            const count = bookingCounts[match.id] || { confirmed: 0, waitlisted: 0 };
            const spotsLeft = match.capacity - count.confirmed;
            const isFull = spotsLeft <= 0;
            const fillPct = Math.min((count.confirmed / match.capacity) * 100, 100);

            return (
              <Link
                to={`/match/${match.id}`}
                key={match.id}
                className="stitch-card card-hover no-underline block"
              >
                {/* Card Header */}
                <div className="p-5">
                  {/* Sport badge + status */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="sport-chip sport-chip--active"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      <span className="material-symbols-outlined text-[14px]">{meta.icon}</span>
                      {match.sport} · {match.format}
                    </div>
                    <div className="flex gap-2">
                      {matchWeather[match.id]?.isHighRainRisk && (
                        <span className="sport-chip sport-chip--inactive text-[#0ea5e9]" title={`${matchWeather[match.id].rainProbability}% rain`}>
                          <span className="material-symbols-outlined text-[14px]">rainy</span>
                          Rain
                        </span>
                      )}
                      {match.status === 'live' && (
                        <span className="live-badge sport-chip" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                          <span className="material-symbols-outlined text-[14px]">bolt</span>
                          LIVE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  <h3 className="font-display text-lg font-semibold text-on-surface mb-2 leading-tight">
                    {match.location}
                  </h3>

                  {/* Details */}
                  <div className="flex flex-col gap-1.5 text-sm text-on-surface-variant mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
                      {format(new Date(match.match_time), 'EEE, MMM d · h:mm a')}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                      {match.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-outline">group</span>
                      {count.confirmed}/{match.capacity} players
                      {count.waitlisted > 0 && (
                        <span className="text-tertiary text-xs font-semibold">
                          +{count.waitlisted} waitlisted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Capacity bar */}
                  <div className="capacity-bar mb-3">
                    <div
                      className={`capacity-bar__fill ${isFull ? 'capacity-bar__fill--full' : 'capacity-bar__fill--ok'}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold ${
                        isFull ? 'text-error' : 'text-primary'
                      }`}
                    >
                      {isFull ? 'Match Full — Join Waitlist' : `${spotsLeft} spots left`}
                    </span>
                    <span className="material-symbols-outlined text-outline text-[18px]">chevron_right</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
