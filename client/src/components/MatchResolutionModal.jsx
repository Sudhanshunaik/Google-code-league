import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { calculateElo } from '../utils/eloCalculator';
import { Loader2, X, Swords } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-md p-6 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-700" />

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-text-muted hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-500/20 rounded-xl">
            <Swords size={24} className="text-orange-500" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">Resolve Match</h2>
            <p className="text-xs text-text-secondary">Enter final scores to update ELO</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            {/* Team A Input */}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-bold text-goa-ocean flex justify-between">
                Team A <span className="text-xs font-normal opacity-70">Avg: {Math.round(teams.sumA / teams.teamA.length)}</span>
              </label>
              <input
                type="number"
                min="0"
                value={teamAScore}
                onChange={(e) => setTeamAScore(e.target.value)}
                className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl font-bold text-white focus:border-orange-500 focus:outline-none transition-colors"
                placeholder="0"
              />
            </div>

            <div className="text-text-muted font-bold text-xl pt-6">VS</div>

            {/* Team B Input */}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-bold text-goa-coral flex justify-between">
                Team B <span className="text-xs font-normal opacity-70">Avg: {Math.round(teams.sumB / teams.teamB.length)}</span>
              </label>
              <input
                type="number"
                min="0"
                value={teamBScore}
                onChange={(e) => setTeamBScore(e.target.value)}
                className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-center text-2xl font-bold text-white focus:border-orange-500 focus:outline-none transition-colors"
                placeholder="0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-500 transition-colors flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(234,88,12,0.3)] hover:shadow-[0_0_25px_rgba(234,88,12,0.5)]"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Finalize Match'}
          </button>
        </form>
      </div>
    </div>
  );
}
