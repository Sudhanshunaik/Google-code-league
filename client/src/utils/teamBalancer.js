/**
 * Team Balancing Algorithm
 * 
 * Uses a greedy partition approach to split players into two teams
 * with the most balanced total skill ratings possible.
 * 
 * Algorithm:
 * 1. Sort players by skill_rating descending
 * 2. Assign each player to the team with the lower total rating
 * 3. This greedy approach gives a near-optimal partition
 * 
 * @param {Array} players - Array of player objects with { id, name, skill_rating }
 * @returns {{ teamA: Array, teamB: Array, deltaSkill: number }}
 */
export function balanceTeams(players) {
  if (!players || players.length < 2) {
    return { teamA: players || [], teamB: [], deltaSkill: 0 };
  }

  // Sort descending by skill — assign best players first for best balance
  const sorted = [...players].sort((a, b) => b.skill_rating - a.skill_rating);

  const teamA = [];
  const teamB = [];
  let sumA = 0;
  let sumB = 0;

  for (const player of sorted) {
    // Always assign the next player to the weaker team
    if (sumA <= sumB) {
      teamA.push(player);
      sumA += player.skill_rating;
    } else {
      teamB.push(player);
      sumB += player.skill_rating;
    }
  }

  return {
    teamA,
    teamB,
    sumA,
    sumB,
    deltaSkill: Math.abs(sumA - sumB),
  };
}
