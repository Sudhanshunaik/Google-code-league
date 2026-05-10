/**
 * CancellationModal — Stitch Coastal Pulse Design
 * 
 * Shows cancellation confirmation with refund policy breakdown.
 * Implements the Susegad Insurance system.
 */
import { useMemo } from 'react';
import { differenceInHours } from 'date-fns';

export default function CancellationModal({ match, user, onClose, onConfirm, loading }) {
  const hoursRemaining = differenceInHours(new Date(match.match_time), new Date());
  const price = match.price || 200;

  // Calculate refund based on time remaining
  // > 12 hours: 100%
  // 6 - 12 hours: 50%
  // 2 - 6 hours: 20%
  // < 2 hours: 0%
  const { refundPercent, refundAmount, penaltyAmount } = useMemo(() => {
    let percent = 0;
    if (hoursRemaining > 12) percent = 100;
    else if (hoursRemaining >= 6) percent = 50;
    else if (hoursRemaining >= 2) percent = 20;
    else percent = 0;

    const refund = (price * percent) / 100;
    const penalty = price - refund;

    return { refundPercent: percent, refundAmount: refund, penaltyAmount: penalty };
  }, [hoursRemaining, price]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-sm animate-in">
      <div className="stitch-card w-full max-w-md overflow-hidden relative shadow-2xl">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-outline-variant flex items-center justify-between">
          <h2 className="font-display font-bold text-xl flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-tertiary text-[24px]">warning</span>
            Cancel Booking
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-high text-on-surface-variant transition-colors cursor-pointer border-none"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-on-surface-variant mb-6">
            You are cancelling your spot for <strong className="text-on-surface">{match.sport} at {match.location}</strong>. 
            Time remaining: <strong className="text-on-surface">{hoursRemaining} hours</strong>.
          </p>

          {/* Refund Details */}
          <div className="bg-surface-low rounded-2xl p-4 mb-6 border border-outline-variant">
            <div className="flex justify-between items-center mb-2">
              <span className="text-on-surface-variant text-sm">Amount Paid:</span>
              <span className="font-semibold text-on-surface">₹{price}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-tertiary text-sm flex items-center gap-1">
                Susegad Penalty
                <span className="material-symbols-outlined text-[14px]">help</span>
              </span>
              <span className="font-semibold text-tertiary">-₹{penaltyAmount}</span>
            </div>
            <div className="h-px bg-outline-variant my-2" />
            <div className="flex justify-between items-center">
              <span className="text-on-surface font-bold">Total Refund:</span>
              <span className="font-bold text-xl text-primary">₹{refundAmount}</span>
            </div>
          </div>

          {/* Susegad Insurance Notice */}
          {penaltyAmount > 0 && (
            <div className="bg-tertiary-fixed/30 border border-tertiary/20 rounded-2xl p-3 mb-6 flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary shrink-0 mt-0.5 text-[18px]">shield</span>
              <p className="text-xs text-on-surface-variant">
                <strong className="text-on-surface">Susegad Insurance Active:</strong> Your penalty of ₹{penaltyAmount} will be split automatically among your teammates to compensate them.
              </p>
            </div>
          )}

          {/* Refund Policy Chart */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">Refund Policy</h4>
            <div className="flex flex-col gap-2">
              <div className={`flex justify-between items-center text-xs p-2.5 rounded-xl ${hoursRemaining > 12 ? 'bg-primary/10 text-primary border border-primary/20 font-bold' : 'text-on-surface-variant'}`}>
                <span>&gt; 12 hours before</span>
                <span>100% Refund</span>
              </div>
              <div className={`flex justify-between items-center text-xs p-2.5 rounded-xl ${hoursRemaining <= 12 && hoursRemaining >= 6 ? 'bg-tertiary-fixed/30 text-tertiary border border-tertiary/20 font-bold' : 'text-on-surface-variant'}`}>
                <span>6 - 12 hours before</span>
                <span>50% Refund</span>
              </div>
              <div className={`flex justify-between items-center text-xs p-2.5 rounded-xl ${hoursRemaining < 6 && hoursRemaining >= 2 ? 'bg-tertiary-fixed/30 text-tertiary border border-tertiary/20 font-bold' : 'text-on-surface-variant'}`}>
                <span>2 - 6 hours before</span>
                <span>20% Refund</span>
              </div>
              <div className={`flex justify-between items-center text-xs p-2.5 rounded-xl ${hoursRemaining < 2 ? 'bg-error-container text-error border border-error/20 font-bold' : 'text-on-surface-variant'}`}>
                <span>&lt; 2 hours before</span>
                <span>No Refund</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} disabled={loading} className="btn-secondary flex-1 text-sm py-2.5">
              Keep Booking
            </button>
            <button onClick={() => onConfirm(penaltyAmount, refundAmount)} disabled={loading} className="btn-danger flex-1 text-sm py-2.5">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  Processing…
                </span>
              ) : 'Confirm Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
