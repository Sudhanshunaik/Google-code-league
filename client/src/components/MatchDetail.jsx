/**
 * MatchDetail — Booking, Waitlist & Team Display
 * 
 * Shows full details for a single match.
 * Users can book a spot, join the waitlist if full, or cancel.
 * When a match reaches capacity, displays auto-balanced teams.
 * Uses Supabase Realtime for instant UI updates.
 */
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { balanceTeams } from '../utils/teamBalancer';
import { getSportMeta } from '../utils/sportsMeta';
import { getMatchWeather } from '../utils/weather';
import { triggerRainAlertWebhook, triggerCancellationWebhook } from '../utils/webhook';
import { format } from 'date-fns';
import {
  ArrowLeft, MapPin, Clock, Users, UserCheck, UserX,
  Loader2, Zap, Shield, Swords, AlertTriangle, CloudRain, Trophy, Info
} from 'lucide-react';
import MatchResolutionModal from './MatchResolutionModal';
import CancellationModal from './CancellationModal';

export default function MatchDetail({ user, profile }) {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [weather, setWeather] = useState(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Fetch match data
  useEffect(() => {
    const fetchMatch = async () => {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        setMatch(data);
        const matchWeather = await getMatchWeather(data.latitude, data.longitude, data.match_time);
        setWeather(matchWeather);
      }
      setLoading(false);
    };

    fetchMatch();
  }, [id]);

  // Fetch bookings & player profiles for this match
  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('match_id', id)
      .in('status', ['confirmed', 'waitlisted'])
      .order('created_at', { ascending: true });

    if (!error && data) {
      setBookings(data);

      // Fetch profiles for all booked players
      const userIds = data.map((b) => b.user_id);
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (profileData) {
          const map = {};
          profileData.forEach((p) => { map[p.id] = p; });
          setProfiles(map);
        }
      }
    }
  };

  useEffect(() => {
    fetchBookings();

    // Subscribe to realtime booking changes for THIS match
    const channel = supabase
      .channel(`match-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `match_id=eq.${id}`,
        },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Derived state
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const waitlistedBookings = bookings.filter((b) => b.status === 'waitlisted');
  const myBooking = bookings.find((b) => b.user_id === user?.id);
  const isFull = match ? confirmedBookings.length >= match.capacity : false;

  // Auto-balance teams when match is full
  const teams = useMemo(() => {
    if (!isFull || confirmedBookings.length < 2) return null;

    const players = confirmedBookings.map((b) => ({
      ...profiles[b.user_id],
      booking_id: b.id,
    })).filter(Boolean);

    if (players.length < 2) return null;
    return balanceTeams(players);
  }, [isFull, confirmedBookings, profiles]);

  // ---------- Actions ----------

  const handleBook = async () => {
    if (!user || !profile) return;
    
    const price = match?.price || 200;
    if (profile.wallet_balance < price) {
      setError(`Insufficient balance. You need ₹${price} to book this match.`);
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const status = isFull ? 'waitlisted' : 'confirmed';

      const { error } = await supabase
        .from('bookings')
        .insert({ match_id: id, user_id: user.id, status, payment_status: 'paid' });

      if (error) throw error;

      // Deduct balance
      const { error: walletError } = await supabase
        .from('profiles')
        .update({ wallet_balance: profile.wallet_balance - price })
        .eq('id', user.id);
        
      if (walletError) throw walletError;

      // Record transaction
      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        amount: price,
        type: 'debit',
        description: `Booked match: ${match.sport} at ${match.location}`
      });
      
      // Rain-Check Feature: Trigger n8n webhook if probability is high
      if (weather && weather.isHighRainRisk) {
        triggerRainAlertWebhook(match, user, weather.rainProbability);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmCancel = async (penaltyAmount, refundAmount) => {
    if (!myBooking) return;
    setActionLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', payment_status: refundAmount > 0 ? 'refunded' : 'forfeited' })
        .eq('id', myBooking.id);

      if (error) throw error;

      // Process refund if any
      if (refundAmount > 0) {
        const { error: walletError } = await supabase
          .from('profiles')
          .update({ wallet_balance: profile.wallet_balance + refundAmount })
          .eq('id', user.id);
          
        if (walletError) throw walletError;

        await supabase.from('wallet_transactions').insert({
          user_id: user.id,
          amount: refundAmount,
          type: 'credit',
          description: `Refund for cancelled match: ${match.sport}`
        });
      }

      // Trigger n8n webhook to redistribute penalty to other players
      if (penaltyAmount > 0) {
        triggerCancellationWebhook(match, user, penaltyAmount, refundAmount);
      }

      setShowCancelModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-goa-ocean" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertTriangle size={40} className="mx-auto text-goa-sun mb-3" />
        <p className="text-text-secondary">Match not found.</p>
        <Link to="/" className="text-goa-ocean text-sm mt-2 inline-block">← Back to Dashboard</Link>
      </div>
    );
  }

  const meta = getSportMeta(match.sport);
  const spotsLeft = match.capacity - confirmedBookings.length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-text-secondary hover:text-primary text-sm mb-6 no-underline transition-colors"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      {/* Rain Alert Banner */}
      {weather && weather.isHighRainRisk && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <CloudRain size={24} className="text-blue-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-blue-400 font-bold mb-1">Weather Watch: {weather.rainProbability}% Chance of Rain</h3>
            <p className="text-sm text-text-secondary">High chance of rain during this match! Check with the turf manager or carry your rain gear. We'll send an automated alert to all booked players.</p>
          </div>
        </div>
      )}

      {/* Match Header Card */}
      <div className="glass rounded-2xl p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-3"
              style={{ background: meta.bg, color: meta.color }}
            >
              <span className="text-lg">{meta.emoji}</span>
              {match.sport} · {match.format}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-text-primary mb-2">
              {match.location}
            </h1>
            <div className="flex flex-col gap-1.5 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-text-muted" />
                {format(new Date(match.match_time), 'EEEE, MMMM d, yyyy · h:mm a')}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-text-muted" />
                {match.location}, Goa
              </div>
            </div>
          </div>

          {/* Capacity badge and Pot */}
          <div className="flex flex-col items-center sm:items-end gap-3">
            <div className="flex flex-col items-end gap-1 group relative">
              <div className="bg-surface/50 border border-white/5 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <span className="text-xs text-text-muted">Total Pot</span>
                <span className="text-goa-sun font-bold">₹{confirmedBookings.length * (match.price || 200)}</span>
                <Info size={14} className="text-text-muted cursor-help" />
              </div>
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface-hover border border-border p-3 rounded-xl text-xs text-text-secondary opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-xl">
                <strong className="text-goa-sun block mb-1">Susegad Insurance Active</strong>
                If you cancel late, your deposit penalty is split among the team. Stakes locked!
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
                isFull
                  ? 'bg-goa-coral/15 text-goa-coral'
                  : 'bg-goa-palm/15 text-goa-palm'
              }`}>
                <Users size={16} />
                {confirmedBookings.length}/{match.capacity}
              </div>
              <span className={`text-xs font-medium ${isFull ? 'text-goa-coral' : 'text-goa-palm'}`}>
                {isFull ? 'Match Full' : `${spotsLeft} spots remaining`}
              </span>
            </div>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="w-full h-2 rounded-full bg-surface overflow-hidden mb-6">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min((confirmedBookings.length / match.capacity) * 100, 100)}%`,
              background: isFull
                ? 'linear-gradient(90deg, #f43f5e, #ef4444)'
                : 'linear-gradient(90deg, #06b6d4, #10b981)',
            }}
          />
        </div>

        {/* Action Button */}
        {error && (
          <div className="bg-goa-coral/10 border border-goa-coral/30 rounded-xl px-4 py-2.5 text-goa-coral text-sm mb-4">
            {error}
          </div>
        )}

        {match.status === 'completed' ? (
          <div className="bg-surface-hover rounded-xl px-4 py-3 text-text-secondary text-sm text-center">
            This match has ended.
          </div>
        ) : !myBooking ? (
          <button
            onClick={handleBook}
            disabled={actionLoading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
              isFull ? 'btn-secondary' : 'btn-primary'
            }`}
          >
            {actionLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : isFull ? (
              <><UserCheck size={18} /> Join Waitlist (₹{match?.price || 200})</>
            ) : (
              <><Zap size={18} /> Book Your Spot (₹{match?.price || 200})</>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold ${
              myBooking.status === 'confirmed'
                ? 'bg-goa-palm/15 text-goa-palm'
                : 'bg-goa-sun/15 text-goa-sun'
            }`}>
              <UserCheck size={16} />
              {myBooking.status === 'confirmed' ? 'You\'re Booked!' : 'You\'re on the Waitlist'}
            </div>
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={actionLoading}
              className="btn-danger flex items-center gap-2"
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <UserX size={16} />}
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Teams Display (only when full) */}
      {teams && (
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h2 className="font-display text-xl font-bold gradient-text flex items-center gap-2">
              <Swords size={20} /> Auto-Balanced Teams
            </h2>
            {match.status !== 'completed' && (
              <button
                onClick={() => setShowResolutionModal(true)}
                className="btn-primary flex items-center gap-2 text-sm bg-orange-600 hover:bg-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_25px_rgba(234,88,12,0.5)] border-none"
              >
                <Trophy size={16} /> Resolve Match
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Team A */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-goa-ocean" />
                  <h3 className="font-display font-bold text-goa-ocean">Team A</h3>
                </div>
                <span className="text-xs font-semibold bg-goa-ocean/15 text-goa-ocean px-2 py-0.5 rounded-full">
                  Skill: {teams.sumA}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {teams.teamA.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-surface/50 rounded-xl px-3 py-2">
                    <span className="text-sm text-text-primary font-medium">{p.name}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 rounded-full bg-surface overflow-hidden">
                        <div className="h-full rounded-full skill-fill" style={{ width: `${p.skill_rating * 10}%` }} />
                      </div>
                      <span className="text-xs text-text-muted w-4 text-right">{p.skill_rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team B */}
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-goa-coral" />
                  <h3 className="font-display font-bold text-goa-coral">Team B</h3>
                </div>
                <span className="text-xs font-semibold bg-goa-coral/15 text-goa-coral px-2 py-0.5 rounded-full">
                  Skill: {teams.sumB}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {teams.teamB.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-surface/50 rounded-xl px-3 py-2">
                    <span className="text-sm text-text-primary font-medium">{p.name}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 rounded-full bg-surface overflow-hidden">
                        <div className="h-full rounded-full skill-fill" style={{ width: `${p.skill_rating * 10}%` }} />
                      </div>
                      <span className="text-xs text-text-muted w-4 text-right">{p.skill_rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-text-muted text-xs text-center mt-3">
            Δ Skill Difference: {teams.deltaSkill} point{teams.deltaSkill !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Player Lists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Confirmed Players */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-display font-semibold text-text-primary mb-3 flex items-center gap-2">
            <UserCheck size={16} className="text-goa-palm" />
            Confirmed ({confirmedBookings.length})
          </h3>
          {confirmedBookings.length === 0 ? (
            <p className="text-text-muted text-sm">No one has booked yet. Be the first!</p>
          ) : (
            <div className="flex flex-col gap-2">
              {confirmedBookings.map((b, i) => {
                const p = profiles[b.user_id];
                return (
                  <div key={b.id} className="flex items-center gap-2 bg-surface/50 rounded-xl px-3 py-2">
                    <span className="text-xs text-text-muted w-5">{i + 1}.</span>
                    <span className="text-sm text-text-primary font-medium flex-1">
                      {p?.name || 'Player'}
                      {b.user_id === user?.id && (
                        <span className="text-goa-ocean text-xs ml-1">(You)</span>
                      )}
                    </span>
                    {p?.skill_rating && (
                      <span className="text-xs text-text-muted">⭐ {p.skill_rating}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Waitlist */}
        <div className="glass rounded-2xl p-5">
          <h3 className="font-display font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Clock size={16} className="text-goa-sun" />
            Waitlist ({waitlistedBookings.length})
          </h3>
          {waitlistedBookings.length === 0 ? (
            <p className="text-text-muted text-sm">No one on the waitlist.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {waitlistedBookings.map((b, i) => {
                const p = profiles[b.user_id];
                return (
                  <div key={b.id} className="flex items-center gap-2 bg-surface/50 rounded-xl px-3 py-2">
                    <span className="text-xs text-goa-sun w-5">#{i + 1}</span>
                    <span className="text-sm text-text-primary font-medium flex-1">
                      {p?.name || 'Player'}
                      {b.user_id === user?.id && (
                        <span className="text-goa-sun text-xs ml-1">(You)</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showResolutionModal && teams && (
        <MatchResolutionModal
          match={match}
          teams={teams}
          onClose={() => setShowResolutionModal(false)}
          onSuccess={() => {
            setShowResolutionModal(false);
            window.location.reload(); // Simple reload to get updated match status and profiles
          }}
        />
      )}

      {showCancelModal && myBooking && (
        <CancellationModal 
          match={match}
          user={user}
          loading={actionLoading}
          onClose={() => setShowCancelModal(false)}
          onConfirm={handleConfirmCancel}
        />
      )}
    </div>
  );
}
