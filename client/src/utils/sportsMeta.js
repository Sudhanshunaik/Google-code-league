/**
 * Sport metadata — Material Symbols icons, emojis, colors, and labels
 * Used across the UI for consistent sport theming
 */
export const SPORTS = {
  Futsal: { emoji: '⚽', icon: 'sports_soccer', color: '#006c49', bg: 'rgba(0,108,73,0.08)', label: 'Futsal' },
  Football: { emoji: '🏟️', icon: 'sports_soccer', color: '#006c49', bg: 'rgba(0,108,73,0.08)', label: 'Football' },
  Cricket: { emoji: '🏏', icon: 'sports_cricket', color: '#855300', bg: 'rgba(133,83,0,0.08)', label: 'Cricket' },
  Volleyball: { emoji: '🏐', icon: 'sports_volleyball', color: '#006a63', bg: 'rgba(0,106,99,0.08)', label: 'Volleyball' },
  Kabaddi: { emoji: '🤼', icon: 'sports_martial_arts', color: '#855300', bg: 'rgba(133,83,0,0.08)', label: 'Kabaddi' },
  Tennis: { emoji: '🎾', icon: 'sports_tennis', color: '#006a63', bg: 'rgba(0,106,99,0.08)', label: 'Tennis' },
  Padel: { emoji: '🏓', icon: 'sports_tennis', color: '#006c49', bg: 'rgba(0,108,73,0.08)', label: 'Padel' },
};

/**
 * Get sport meta, with a sensible fallback
 */
export function getSportMeta(sport) {
  return SPORTS[sport] || { emoji: '🎯', icon: 'sports', color: '#6c7a71', bg: 'rgba(108,122,113,0.08)', label: sport };
}
