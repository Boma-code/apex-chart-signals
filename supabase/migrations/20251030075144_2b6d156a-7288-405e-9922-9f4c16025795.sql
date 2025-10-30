-- Create paper trading portfolio table
CREATE TABLE public.paper_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  exit_price NUMERIC,
  quantity NUMERIC NOT NULL,
  position_type TEXT NOT NULL CHECK (position_type IN ('long', 'short')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  stop_loss NUMERIC,
  take_profit NUMERIC,
  pnl NUMERIC,
  pnl_percentage NUMERIC,
  analysis_id UUID REFERENCES public.chart_analyses(id),
  opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paper_trades ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own trades"
ON public.paper_trades
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own trades"
ON public.paper_trades
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trades"
ON public.paper_trades
FOR UPDATE
USING (auth.uid() = user_id);

-- Create backtesting results table
CREATE TABLE public.backtest_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  analysis_id UUID REFERENCES public.chart_analyses(id),
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  initial_capital NUMERIC NOT NULL,
  final_capital NUMERIC NOT NULL,
  total_trades INTEGER NOT NULL,
  winning_trades INTEGER NOT NULL,
  losing_trades INTEGER NOT NULL,
  win_rate NUMERIC NOT NULL,
  total_pnl NUMERIC NOT NULL,
  total_pnl_percentage NUMERIC NOT NULL,
  max_drawdown NUMERIC NOT NULL,
  sharpe_ratio NUMERIC,
  trades_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backtest_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own backtest results"
ON public.backtest_results
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own backtest results"
ON public.backtest_results
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add performance tracking to chart analyses
ALTER TABLE public.chart_analyses
ADD COLUMN IF NOT EXISTS actual_outcome TEXT,
ADD COLUMN IF NOT EXISTS outcome_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS outcome_pnl NUMERIC;