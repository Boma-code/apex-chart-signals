-- Create analyses table to store chart analysis history
CREATE TABLE public.chart_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('forex', 'crypto', 'stocks')),
  signal TEXT NOT NULL CHECK (signal IN ('BUY', 'SELL', 'HOLD')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  entry_price DECIMAL,
  stop_loss DECIMAL,
  take_profit DECIMAL,
  market_condition TEXT,
  ai_commentary TEXT NOT NULL,
  pattern_details TEXT,
  indicators_analysis TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.chart_analyses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (for history viewing)
CREATE POLICY "Allow public read access to chart analyses"
  ON public.chart_analyses
  FOR SELECT
  USING (true);

-- Create policy to allow public insert (for creating new analyses)
CREATE POLICY "Allow public insert of chart analyses"
  ON public.chart_analyses
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_chart_analyses_created_at ON public.chart_analyses(created_at DESC);
CREATE INDEX idx_chart_analyses_asset_type ON public.chart_analyses(asset_type);