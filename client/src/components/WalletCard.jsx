import React from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

export default function WalletCard({ balance }) {
  return (
    <div className="glass rounded-2xl p-6 sm:p-8 mb-6 relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-goa-sun/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-goa-sun/20 transition-colors duration-500 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-goa-ocean/10 rounded-full blur-3xl -ml-16 -mb-16 group-hover:bg-goa-ocean/20 transition-colors duration-500 pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-white/10 p-2 rounded-xl">
              <Wallet size={20} className="text-goa-sun" />
            </div>
            <h2 className="font-display font-semibold text-text-primary text-lg">ArenaGoa Wallet</h2>
          </div>
          
          <div className="flex flex-col">
            <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-goa-sun to-goa-ocean">
              ₹{balance?.toLocaleString() || 0}
            </span>
            <span className="text-xs text-text-muted mt-1 flex items-center gap-1">
              Available Balance <Info size={12} />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button className="flex-1 sm:flex-none btn-secondary flex items-center justify-center gap-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10">
            <ArrowUpRight size={16} className="text-goa-palm" />
            Withdraw
          </button>
          <button className="flex-1 sm:flex-none btn-primary flex items-center justify-center gap-2 text-sm shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Plus size={16} />
            Add Funds
          </button>
        </div>
      </div>
    </div>
  );
}
