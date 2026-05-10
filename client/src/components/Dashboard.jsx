/**
 * Dashboard — Match Discovery
 * 
 * Shows all upcoming matches grouped by sport.
 * Users can filter by sport and click to view/book each match.
 * Subscribes to Supabase Realtime for live booking counts.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getSportMeta } from '../utils/sportsMeta';
import { getMatchWeather } from '../utils/weather';
import { format } from 'date-fns';
import {
  MapPin, Clock, Users, ChevronRight, Filter,
  Loader2, Zap, Search, CloudRain
} from 'lucide-react';

export default function Dashboard() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-goa-ocean" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
          <span className="gradient-text">Find Your Game</span> 🏖️
        </h1>
        <p className="text-text-secondary text-sm sm:text-base max-w-lg mx-auto">
          Book a spot at the best turfs and grounds across Goa.
          Real-time updates, balanced teams, pure competition.
        </p>
      </div>

      {/* Sport Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <Filter size={16} className="text-text-muted flex-shrink-0" />
        {sports.map((sport) => {
          const meta = sport !== 'All' ? getSportMeta(sport) : null;
          return (
            <button
              key={sport}
              onClick={() => setSportFilter(sport)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border cursor-pointer ${
                sportFilter === sport
                  ? 'bg-goa-ocean/15 text-goa-ocean border-goa-ocean/30'
                  : 'bg-surface-card text-text-secondary border-border hover:border-goa-ocean/30'
              }`}
            >
              {meta && <span>{meta.emoji}</span>}
              {sport}
            </button>
          );
        })}
      </div>

      {/* Matches Grid */}
      {filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Search size={40} className="mx-auto text-text-muted mb-3" />
          <p className="text-text-secondary">No matches found. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((match) => {
            const meta = getSportMeta(match.sport);
            const count = bookingCounts[match.id] || { confirmed: 0, waitlisted: 0 };
            const spotsLeft = match.capacity - count.confirmed;
            const isFull = spotsLeft <= 0;

            return (
              <Link
                to={`/match/${match.id}`}
                key={match.id}
                className="glass rounded-2xl p-5 card-hover no-underline block"
              >
                {/* Sport badge */}
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: meta.bg, color: meta.color }}
                  >
                    <span>{meta.emoji}</span>
                    {match.sport} · {match.format}
                  </div>
                  <div className="flex gap-2">
                    {matchWeather[match.id]?.isHighRainRisk && (
                      <span className="live-badge flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold" title={`${matchWeather[match.id].rainProbability}% chance of rain`}>
                        <CloudRain size={10} /> Rain Watch
                      </span>
                    )}
                    {match.status === 'live' && (
                      <span className="live-badge flex items-center gap-1 px-2 py-0.5 rounded-full bg-goa-palm/20 text-goa-palm text-xs font-bold">
                        <Zap size={10} /> LIVE
                      </span>
                    )}
                  </div>
                </div>

                {/* Location */}
                <h3 className="font-display text-lg font-semibold text-text-primary mb-2 leading-tight">
                  {match.location}
                </h3>

                {/* Details */}
                <div className="flex flex-col gap-1.5 text-sm text-text-secondary mb-4">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-text-muted" />
                    {format(new Date(match.match_time), 'EEE, MMM d · h:mm a')}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-text-muted" />
                    {match.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-text-muted" />
                    {count.confirmed}/{match.capacity} players
                    {count.waitlisted > 0 && (
                      <span className="text-goa-sun text-xs">
                        +{count.waitlisted} waitlisted
                      </span>
                    )}
                  </div>
                </div>

                {/* Capacity bar */}
                <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((count.confirmed / match.capacity) * 100, 100)}%`,
                      background: isFull
                        ? 'linear-gradient(90deg, #f43f5e, #ef4444)'
                        : 'linear-gradient(90deg, #06b6d4, #10b981)',
                    }}
                  />
                </div>

                {/* CTA */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      isFull ? 'text-goa-coral' : 'text-goa-palm'
                    }`}
                  >
                    {isFull ? 'Match Full — Join Waitlist' : `${spotsLeft} spots left`}
                  </span>
                  <ChevronRight size={16} className="text-text-muted" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
