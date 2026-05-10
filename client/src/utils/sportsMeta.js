/**
 * Sport metadata — icons (emoji), colors, and labels
 * Used across the UI for consistent sport theming
 */
export const SPORTS = {
  Futsal: { emoji: '⚽', color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Futsal' },
  Football: { emoji: '🏟️', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Football' },
  Cricket: { emoji: '🏏', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Cricket' },
  Volleyball: { emoji: '🏐', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Volleyball' },
  Kabaddi: { emoji: '🤼', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Kabaddi' },
};

/**
 * Get sport meta, with a sensible fallback
 */
export function getSportMeta(sport) {
  return SPORTS[sport] || { emoji: '🎯', color: '#6b7280', bg: 'rgba(107,114,128,0.12)', label: sport };
}
