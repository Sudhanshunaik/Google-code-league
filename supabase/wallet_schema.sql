-- ============================================================
-- WALLET & CANCELLATION SCHEMA MIGRATION SCRIPT
-- ============================================================

-- 1. Add wallet balance to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_balance integer not null default 1000;

-- 2. Add match price to matches
-- Defaulting to 200, but can be dynamic based on venue
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS price integer not null default 200;

-- 3. Add payment_status to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'refunded', 'forfeited'));

-- 4. Create wallet transactions table
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    amount integer not null,
    type text not null check (type in ('credit', 'debit')),
    description text not null,
    created_at timestamptz default now()
);

-- Enable RLS on wallet_transactions
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);

-- 5. Enable Realtime on profiles to listen to wallet balance changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
