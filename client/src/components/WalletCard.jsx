/**
 * WalletCard — Stitch Coastal Pulse Design
 * 
 * Displays wallet balance with functional Add Funds & Withdraw actions.
 * Uses Supabase to update balance and record wallet transactions.
 */
import { useState } from 'react';
import { supabase } from '../lib/supabase';

const PRESET_AMOUNTS = [100, 200, 500, 1000];

export default function WalletCard({ balance, userId, onBalanceUpdate }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddFunds = async () => {
    const value = parseInt(amount);
    if (!value || value <= 0) return;
    setProcessing(true);

    try {
      const newBalance = (balance || 0) + value;

      const { error: walletError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', userId);

      if (walletError) throw walletError;

      // Record transaction
      await supabase.from('wallet_transactions').insert({
        user_id: userId,
        amount: value,
        type: 'credit',
        description: `Added ₹${value} to wallet`
      });

      onBalanceUpdate?.(newBalance);
      setShowAddModal(false);
      setAmount('');
      showToast(`₹${value} added to your wallet!`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const value = parseInt(amount);
    if (!value || value <= 0) return;
    if (value > (balance || 0)) {
      showToast('Insufficient balance', 'error');
      return;
    }
    setProcessing(true);

    try {
      const newBalance = (balance || 0) - value;

      const { error: walletError } = await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', userId);

      if (walletError) throw walletError;

      // Record transaction
      await supabase.from('wallet_transactions').insert({
        user_id: userId,
        amount: value,
        type: 'debit',
        description: `Withdrew ₹${value} from wallet`
      });

      onBalanceUpdate?.(newBalance);
      setShowWithdrawModal(false);
      setAmount('');
      showToast(`₹${value} withdrawn successfully!`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setProcessing(false);
    }
  };

  const WalletModal = ({ title, icon, action, actionLabel, actionClass, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/30 backdrop-blur-sm animate-in">
      <div className="stitch-card w-full max-w-sm p-6 shadow-2xl relative overflow-hidden">
        {/* Accent bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-tertiary" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-high text-on-surface-variant transition-colors cursor-pointer border-none"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-container/20 rounded-2xl">
            <span className="material-symbols-outlined text-primary text-[24px]">{icon}</span>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-on-surface">{title}</h2>
            <p className="text-xs text-on-surface-variant">Current balance: ₹{(balance || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Preset Amounts */}
        <div className="flex gap-2 mb-4">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              onClick={() => setAmount(preset.toString())}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all border cursor-pointer ${
                parseInt(amount) === preset
                  ? 'bg-primary text-on-primary border-primary shadow-sm'
                  : 'bg-surface-container text-on-surface-variant border-transparent hover:border-primary/30'
              }`}
            >
              ₹{preset}
            </button>
          ))}
        </div>

        {/* Custom amount input */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 tracking-wider uppercase">
            Custom Amount
          </label>
          <div className="flex items-center gap-2 bg-surface-container rounded-full px-4 py-3 border border-transparent focus-within:border-primary transition-colors">
            <span className="text-on-surface font-bold text-lg">₹</span>
            <input
              type="number"
              min="1"
              max={title.includes('Withdraw') ? balance || 0 : 50000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="bg-transparent border-none outline-none text-on-surface text-lg font-bold flex-1 placeholder:text-outline placeholder:font-normal placeholder:text-sm"
            />
          </div>
        </div>

        <button
          onClick={action}
          disabled={processing || !amount || parseInt(amount) <= 0}
          className={`w-full py-3.5 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${actionClass}`}
        >
          {processing ? (
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              {actionLabel} {amount ? `₹${parseInt(amount).toLocaleString()}` : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className="stitch-card p-5 sm:p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-tertiary text-[24px]">account_balance_wallet</span>
              <h2 className="font-display font-semibold text-on-surface text-base">ArenaLink Wallet</h2>
            </div>
            
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-primary font-display">
                ₹{balance?.toLocaleString() || 0}
              </span>
              <span className="text-xs text-on-surface-variant mt-1 flex items-center gap-1">
                Available Balance
                <span className="material-symbols-outlined text-[14px]">info</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => { setAmount(''); setShowWithdrawModal(true); }}
              className="flex-1 sm:flex-none btn-secondary flex items-center justify-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">arrow_upward</span>
              Withdraw
            </button>
            <button
              onClick={() => { setAmount(''); setShowAddModal(true); }}
              className="flex-1 sm:flex-none btn-primary flex items-center justify-center gap-2 text-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              Add Funds
            </button>
          </div>
        </div>
      </div>

      {/* Add Funds Modal */}
      {showAddModal && (
        <WalletModal
          title="Add Funds"
          icon="add_circle"
          action={handleAddFunds}
          actionLabel="Add"
          actionClass="bg-primary text-on-primary"
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <WalletModal
          title="Withdraw Funds"
          icon="arrow_upward"
          action={handleWithdraw}
          actionLabel="Withdraw"
          actionClass="bg-tertiary text-on-tertiary"
          onClose={() => setShowWithdrawModal(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 md:bottom-4 right-4 z-[60] backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg animate-in ${
          toast.type === 'error'
            ? 'bg-error-container/90 border border-error/20 text-error'
            : 'bg-primary-container/90 border border-primary/20 text-on-primary-container'
        }`}>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-xl">
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <span className="font-semibold text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}
