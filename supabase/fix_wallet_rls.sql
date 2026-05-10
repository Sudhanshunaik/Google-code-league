-- Enable Insert Policy for Wallet Transactions
-- This fixes the 403 Forbidden error when trying to book a match or deposit money.

CREATE POLICY "Users can insert own transactions"
ON public.wallet_transactions
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
