/**
 * ELO Rating System Calculator
 * 
 * Calculates the rating adjustment (delta) based on the standard ELO formula.
 * R'_A = R_A + K * (S_A - E_A)
 * 
 * @param {number} teamA_Avg - The average ELO rating of Team A
 * @param {number} teamB_Avg - The average ELO rating of Team B
 * @param {'win' | 'loss' | 'draw'} outcome - The outcome of the match for Team A
 * @returns {number} The ELO points to add to Team A (and subtract from Team B)
 */
export function calculateElo(
  teamA_Avg: number,
  teamB_Avg: number,
  outcome: 'win' | 'loss' | 'draw'
): number {
  const K = 32;

  // Actual Score for Team A
  let S_A = 0;
  if (outcome === 'win') S_A = 1;
  else if (outcome === 'draw') S_A = 0.5;
  else if (outcome === 'loss') S_A = 0;

  // Expected Score for Team A
  // E_A = 1 / (1 + 10 ^ ((R_B - R_A) / 400))
  const E_A = 1 / (1 + Math.pow(10, (teamB_Avg - teamA_Avg) / 400));

  // The rating adjustment (delta) to be applied
  const delta = Math.round(K * (S_A - E_A));

  return delta;
}
