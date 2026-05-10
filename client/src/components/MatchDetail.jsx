/**
 * MatchDetail — Booking, Waitlist & Team Display (Coastal Pulse Design)
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
        <span className="material-symbols-outlined text-4xl text-primary animate-pulse">sports_score</span>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <span className="material-symbols-outlined text-5xl text-tertiary mb-3 block">error</span>
        <p className="text-on-surface-variant">Match not found.</p>
        <Link to="/" className="text-primary text-sm mt-2 inline-block no-underline">← Back to Dashboard</Link>
      </div>
    );
  }

  const meta = getSportMeta(match.sport);
  const spotsLeft = match.capacity - confirmedBookings.length;
  const fillPct = Math.min((confirmedBookings.length / match.capacity) * 100, 100);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
      {/* Back link */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary text-sm mb-6 no-underline transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Dashboard
      </Link>

      {/* Rain Alert Banner */}
      {weather && weather.isHighRainRisk && (
        <div className="bg-[#e3f2fd] border border-[#90caf9] rounded-2xl p-4 mb-6 flex items-start gap-3">
          <span className="material-symbols-outlined text-[#1976d2] shrink-0 mt-0.5 text-[24px]">thunderstorm</span>
          <div>
            <h3 className="text-[#1565c0] font-bold mb-1">Weather Watch: {weather.rainProbability}% Chance of Rain</h3>
            <p className="text-sm text-on-surface-variant">High chance of rain during this match! Check with the turf manager or carry your rain gear. We'll send an automated alert to all booked players.</p>
          </div>
        </div>
      )}

      {/* Match Header Card */}
      <div className="stitch-card p-6 sm:p-8 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div
              className="sport-chip sport-chip--active inline-flex mb-3"
              style={{ background: meta.bg, color: meta.color }}
            >
              <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
              {match.sport} · {match.format}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-on-surface mb-2">
              {match.location}
            </h1>
            <div className="flex flex-col gap-1.5 text-sm text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-outline">schedule</span>
                {format(new Date(match.match_time), 'EEEE, MMMM d, yyyy · h:mm a')}
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-outline">location_on</span>
                {match.location}, Goa
              </div>
            </div>
          </div>

          {/* Capacity badge and Pot */}
          <div className="flex flex-col items-center sm:items-end gap-3">
            <div className="flex flex-col items-end gap-1 group relative">
              <div className="bg-surface-low border border-outline-variant rounded-2xl px-3 py-1.5 flex items-center gap-2">
                <span className="text-xs text-on-surface-variant">Total Pot</span>
                <span className="text-tertiary font-bold">₹{confirmedBookings.length * (match.price || 200)}</span>
                <span className="material-symbols-outlined text-[14px] text-outline cursor-help">help</span>
              </div>
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface-lowest border border-outline-variant p-3 rounded-2xl text-xs text-on-surface-variant opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 shadow-xl">
                <strong className="text-tertiary block mb-1">Susegad Insurance Active</strong>
                If you cancel late, your deposit penalty is split among the team. Stakes locked!
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold ${
                isFull
                  ? 'bg-error-container text-error'
                  : 'bg-primary-container/20 text-primary'
              }`}>
                <span className="material-symbols-outlined text-[18px]">group</span>
                {confirmedBookings.length}/{match.capacity}
              </div>
              <span className={`text-xs font-semibold ${isFull ? 'text-error' : 'text-primary'}`}>
                {isFull ? 'Match Full' : `${spotsLeft} spots remaining`}
              </span>
            </div>
          </div>
        </div>

        {/* Capacity bar */}
        <div className="capacity-bar mb-6" style={{ height: '8px' }}>
          <div
            className={`capacity-bar__fill ${isFull ? 'capacity-bar__fill--full' : 'capacity-bar__fill--ok'}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>

        {/* Action Button */}
        {error && (
          <div className="bg-error-container border border-error/20 rounded-2xl px-4 py-2.5 text-error text-sm mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {match.status === 'completed' ? (
          <div className="bg-surface-container rounded-2xl px-4 py-3 text-on-surface-variant text-sm text-center">
            This match has ended.
          </div>
        ) : !myBooking ? (
          <button
            onClick={handleBook}
            disabled={actionLoading}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold text-sm transition-all ${
              isFull ? 'btn-secondary' : 'btn-primary'
            }`}
          >
            {actionLoading ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            ) : isFull ? (
              <>
                <span className="material-symbols-outlined text-[20px]">person_add</span>
                Join Waitlist (₹{match?.price || 200})
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">bolt</span>
                Book Your Spot (₹{match?.price || 200})
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold ${
              myBooking.status === 'confirmed'
                ? 'bg-primary-container/20 text-primary'
                : 'bg-tertiary-fixed/30 text-tertiary'
            }`}>
              <span className="material-symbols-outlined text-[18px]">
                {myBooking.status === 'confirmed' ? 'check_circle' : 'schedule'}
              </span>
              {myBooking.status === 'confirmed' ? 'You\'re Booked!' : 'You\'re on the Waitlist'}
            </div>
            <button
              onClick={() => setShowCancelModal(true)}
              disabled={actionLoading}
              className="btn-danger flex items-center gap-2"
            >
              {actionLoading ? (
                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[16px]">person_remove</span>
              )}
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Teams Display (only when full) */}
      {teams && (
        <div className="mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h2 className="font-display text-xl font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[24px]">swords</span>
              Auto-Balanced Teams
            </h2>
            {match.status !== 'completed' && (
              <button
                onClick={() => setShowResolutionModal(true)}
                className="btn-primary flex items-center gap-2 text-sm"
                style={{ background: '#e29100' }}
              >
                <span className="material-symbols-outlined text-[18px]">emoji_events</span>
                Resolve Match
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Team A */}
            <div className="stitch-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">shield</span>
                  <h3 className="font-display font-bold text-primary">Team A</h3>
                </div>
                <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                  Skill: {teams.sumA}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {teams.teamA.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-surface-low rounded-xl px-3 py-2">
                    <span className="text-sm text-on-surface font-medium">{p.name}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 rounded-full bg-surface-container overflow-hidden">
                        <div className="h-full rounded-full skill-fill" style={{ width: `${p.skill_rating * 10}%` }} />
                      </div>
                      <span className="text-xs text-on-surface-variant w-4 text-right">{p.skill_rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team B */}
            <div className="stitch-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">shield</span>
                  <h3 className="font-display font-bold text-secondary">Team B</h3>
                </div>
                <span className="text-xs font-semibold bg-secondary/10 text-secondary px-2.5 py-0.5 rounded-full">
                  Skill: {teams.sumB}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {teams.teamB.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-surface-low rounded-xl px-3 py-2">
                    <span className="text-sm text-on-surface font-medium">{p.name}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-12 h-1.5 rounded-full bg-surface-container overflow-hidden">
                        <div className="h-full rounded-full skill-fill" style={{ width: `${p.skill_rating * 10}%` }} />
                      </div>
                      <span className="text-xs text-on-surface-variant w-4 text-right">{p.skill_rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-on-surface-variant text-xs text-center mt-3">
            Δ Skill Difference: {teams.deltaSkill} point{teams.deltaSkill !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Player Lists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Confirmed Players */}
        <div className="stitch-card p-5">
          <h3 className="font-display font-semibold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[18px]">how_to_reg</span>
            Confirmed ({confirmedBookings.length})
          </h3>
          {confirmedBookings.length === 0 ? (
            <p className="text-on-surface-variant text-sm">No one has booked yet. Be the first!</p>
          ) : (
            <div className="flex flex-col gap-2">
              {confirmedBookings.map((b, i) => {
                const p = profiles[b.user_id];
                return (
                  <div key={b.id} className="flex items-center gap-2 bg-surface-low rounded-xl px-3 py-2">
                    <span className="text-xs text-on-surface-variant w-5">{i + 1}.</span>
                    <span className="text-sm text-on-surface font-medium flex-1">
                      {p?.name || 'Player'}
                      {b.user_id === user?.id && (
                        <span className="text-primary text-xs ml-1">(You)</span>
                      )}
                    </span>
                    {p?.skill_rating && (
                      <span className="rating-badge">
                        <span className="material-symbols-outlined text-[12px]">star</span>
                        {p.skill_rating}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Waitlist */}
        <div className="stitch-card p-5">
          <h3 className="font-display font-semibold text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[18px]">schedule</span>
            Waitlist ({waitlistedBookings.length})
          </h3>
          {waitlistedBookings.length === 0 ? (
            <p className="text-on-surface-variant text-sm">No one on the waitlist.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {waitlistedBookings.map((b, i) => {
                const p = profiles[b.user_id];
                return (
                  <div key={b.id} className="flex items-center gap-2 bg-surface-low rounded-xl px-3 py-2">
                    <span className="text-xs text-tertiary w-5">#{i + 1}</span>
                    <span className="text-sm text-on-surface font-medium flex-1">
                      {p?.name || 'Player'}
                      {b.user_id === user?.id && (
                        <span className="text-tertiary text-xs ml-1">(You)</span>
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
