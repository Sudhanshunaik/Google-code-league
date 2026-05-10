/**
 * MatchResolutionModal — Stitch Coastal Pulse Design
 * 
 * Score submission dialog for finalizing match results and updating ELO.
 */
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { calculateElo } from '../utils/eloCalculator';

export default function MatchResolutionModal({ match, teams, onClose, onSuccess }) {
  const [teamAScore, setTeamAScore] = useState('');
  const [teamBScore, setTeamBScore] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (teamAScore === '' || teamBScore === '') {
      setError("Please enter scores for both teams.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const scoreA = parseInt(teamAScore, 10);
      const scoreB = parseInt(teamBScore, 10);

      let outcome = 'draw';
      if (scoreA > scoreB) outcome = 'win';
      else if (scoreA < scoreB) outcome = 'loss';

      // 1. Calculate Average ELO for both teams
      const avgA = teams.sumA / teams.teamA.length;
      const avgB = teams.sumB / teams.teamB.length;

      // 2. Calculate ELO delta
      const delta = calculateElo(avgA, avgB, outcome);

      // 3. Update Match Status
      const { error: matchError } = await supabase
        .from('matches')
        .update({
          status: 'completed',
          match_status: 'completed',
          team_a_score: scoreA,
          team_b_score: scoreB
        })
        .eq('id', match.id);

      if (matchError) throw matchError;

      // 4. Update Profiles (ELO and matches_played)
      const updatePromises = [];

      // Update Team A
      for (const player of teams.teamA) {
        const newElo = player.skill_rating + delta;
        const newMatchesPlayed = (player.matches_played || 0) + 1;
        updatePromises.push(
          supabase
            .from('profiles')
            .update({ skill_rating: newElo, matches_played: newMatchesPlayed })
            .eq('id', player.id)
        );
      }

      // Update Team B
      for (const player of teams.teamB) {
        const newElo = player.skill_rating - delta;
        const newMatchesPlayed = (player.matches_played || 0) + 1;
        updatePromises.push(
          supabase
            .from('profiles')
            .update({ skill_rating: newElo, matches_played: newMatchesPlayed })
            .eq('id', player.id)
        );
      }

      await Promise.all(updatePromises);

      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to finalize match.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-sm animate-in">
      <div className="stitch-card w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        {/* Accent bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tertiary-container to-tertiary" />

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-high text-on-surface-variant transition-colors cursor-pointer border-none"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-tertiary-fixed/30 rounded-2xl">
            <span className="material-symbols-outlined text-tertiary text-[24px]">swords</span>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-on-surface">Resolve Match</h2>
            <p className="text-xs text-on-surface-variant">Enter final scores to update ELO</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-error-container border border-error/20 rounded-2xl text-error text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            {/* Team A Input */}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-bold text-primary flex justify-between">
                Team A <span className="text-xs font-normal text-on-surface-variant">Avg: {Math.round(teams.sumA / teams.teamA.length)}</span>
              </label>
              <input
                type="number"
                min="0"
                value={teamAScore}
                onChange={(e) => setTeamAScore(e.target.value)}
                className="w-full bg-surface-container border border-transparent rounded-2xl px-4 py-3 text-center text-2xl font-bold text-on-surface focus:border-primary focus:outline-none transition-colors"
                placeholder="0"
              />
            </div>

            <div className="text-on-surface-variant font-bold text-xl pt-6">VS</div>

            {/* Team B Input */}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-bold text-secondary flex justify-between">
                Team B <span className="text-xs font-normal text-on-surface-variant">Avg: {Math.round(teams.sumB / teams.teamB.length)}</span>
              </label>
              <input
                type="number"
                min="0"
                value={teamBScore}
                onChange={(e) => setTeamBScore(e.target.value)}
                className="w-full bg-surface-container border border-transparent rounded-2xl px-4 py-3 text-center text-2xl font-bold text-on-surface focus:border-secondary focus:outline-none transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-full font-bold text-on-primary transition-colors flex items-center justify-center gap-2 shadow-lg border-none cursor-pointer text-sm"
            style={{ background: '#e29100' }}
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">emoji_events</span>
                Finalize Match
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
