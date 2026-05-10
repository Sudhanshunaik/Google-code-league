import React, { useMemo } from 'react';
import { X, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
      <div className="glass rounded-3xl w-full max-w-md overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display font-bold text-xl flex items-center gap-2">
            <AlertTriangle className="text-goa-sun" size={24} />
            Cancel Booking
          </h2>
          <button onClick={onClose} disabled={loading} className="text-text-muted hover:text-text-primary transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-sm text-text-secondary mb-6">
            You are cancelling your spot for <strong className="text-text-primary">{match.sport} at {match.location}</strong>. 
            Time remaining: <strong className="text-text-primary">{hoursRemaining} hours</strong>.
          </p>

          {/* Refund Details */}
          <div className="bg-surface/50 rounded-2xl p-4 mb-6 border border-white/5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-text-secondary text-sm">Amount Paid:</span>
              <span className="font-semibold">₹{price}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-goa-sun text-sm flex items-center gap-1">
                Susegad Penalty <HelpCircle size={12} />
              </span>
              <span className="font-semibold text-goa-sun">-₹{penaltyAmount}</span>
            </div>
            <div className="h-px bg-border my-2" />
            <div className="flex justify-between items-center">
              <span className="text-text-primary font-bold">Total Refund:</span>
              <span className="font-bold text-xl text-goa-ocean">₹{refundAmount}</span>
            </div>
          </div>

          {/* Susegad Insurance Notice */}
          {penaltyAmount > 0 && (
            <div className="bg-goa-sun/10 border border-goa-sun/20 rounded-xl p-3 mb-6 flex items-start gap-3">
              <ShieldCheck className="text-goa-sun shrink-0 mt-0.5" size={18} />
              <p className="text-xs text-goa-sun">
                <strong>Susegad Insurance Active:</strong> Your penalty of ₹{penaltyAmount} will be split automatically among your teammates to compensate them.
              </p>
            </div>
          )}

          {/* Refund Policy Chart */}
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Refund Policy</h4>
            <div className="flex flex-col gap-2">
              <div className={`flex justify-between items-center text-xs p-2 rounded ${hoursRemaining > 12 ? 'bg-goa-ocean/10 text-goa-ocean border border-goa-ocean/20 font-bold' : 'text-text-secondary'}`}>
                <span>&gt; 12 hours before</span>
                <span>100% Refund</span>
              </div>
              <div className={`flex justify-between items-center text-xs p-2 rounded ${hoursRemaining <= 12 && hoursRemaining >= 6 ? 'bg-goa-sun/10 text-goa-sun border border-goa-sun/20 font-bold' : 'text-text-secondary'}`}>
                <span>6 - 12 hours before</span>
                <span>50% Refund</span>
              </div>
              <div className={`flex justify-between items-center text-xs p-2 rounded ${hoursRemaining < 6 && hoursRemaining >= 2 ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold' : 'text-text-secondary'}`}>
                <span>2 - 6 hours before</span>
                <span>20% Refund</span>
              </div>
              <div className={`flex justify-between items-center text-xs p-2 rounded ${hoursRemaining < 2 ? 'bg-goa-coral/10 text-goa-coral border border-goa-coral/20 font-bold' : 'text-text-secondary'}`}>
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
            <button onClick={() => onConfirm(penaltyAmount, refundAmount)} disabled={loading} className="btn-danger flex-1 text-sm py-2.5 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              {loading ? 'Processing...' : 'Confirm Cancel'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
