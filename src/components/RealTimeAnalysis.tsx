import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Activity, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RealTimeAnalysisProps {
  onAnalysisComplete: (analysisData: any) => void;
  user: any;
}

const SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT', type: 'Crypto' },
  { value: 'ETHUSDT', label: 'ETH/USDT', type: 'Crypto' },
  { value: 'SOLUSDT', label: 'SOL/USDT', type: 'Crypto' },
  { value: 'XRPUSDT', label: 'XRP/USDT', type: 'Crypto' },
  { value: 'BNBUSDT', label: 'BNB/USDT', type: 'Crypto' },
  { value: 'ADAUSDT', label: 'ADA/USDT', type: 'Crypto' },
  { value: 'DOGEUSDT', label: 'DOGE/USDT', type: 'Crypto' },
  { value: 'MATICUSDT', label: 'MATIC/USDT', type: 'Crypto' },
];

const INTERVALS = [
  { value: '1', label: '1 Minute' },
  { value: '5', label: '5 Minutes' },
  { value: '15', label: '15 Minutes' },
  { value: '30', label: '30 Minutes' },
  { value: '60', label: '1 Hour' },
  { value: '240', label: '4 Hours' },
  { value: 'D', label: '1 Day' },
];

const RealTimeAnalysis = ({ onAnalysisComplete, user }: RealTimeAnalysisProps) => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [selectedInterval, setSelectedInterval] = useState('15');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!user) {
      toast.error("Please sign in to analyze markets");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Fetch market data
      toast.info("Fetching real-time market data...");
      const { data: marketData, error: marketError } = await supabase.functions.invoke('fetch-market-data', {
        body: { symbol: selectedSymbol, interval: selectedInterval, limit: 100 }
      });

      if (marketError) throw marketError;

      // Generate AI signal
      toast.info("Analyzing with AI...");
      const assetType = SYMBOLS.find(s => s.value === selectedSymbol)?.type || 'Crypto';
      const { data: signalData, error: signalError } = await supabase.functions.invoke('generate-signal', {
        body: { marketData, assetType }
      });

      if (signalError) throw signalError;

      // Save to database
      const { error: dbError } = await supabase
        .from('chart_analyses')
        .insert({
          user_id: user.id,
          image_url: `realtime:${selectedSymbol}:${selectedInterval}`,
          asset_type: assetType,
          signal: signalData.signal,
          confidence: signalData.confidence,
          entry_price: signalData.entry_price,
          stop_loss: signalData.stop_loss,
          take_profit: signalData.take_profit,
          market_condition: signalData.market_condition,
          pattern_details: signalData.pattern_details,
          indicators_analysis: signalData.indicators_analysis,
          ai_commentary: signalData.ai_commentary,
          title: `${selectedSymbol} - ${INTERVALS.find(i => i.value === selectedInterval)?.label}`,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        toast.error('Failed to save analysis.');
      }

      onAnalysisComplete(signalData);
      toast.success('Market analyzed successfully!');
    } catch (error: any) {
      console.error('Analysis error:', error);
      if (error.message?.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please try again in a moment.');
      } else if (error.message?.includes('Payment required')) {
        toast.error('Please add credits to continue using AI analysis.');
      } else {
        toast.error('Failed to analyze market. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="border-2 border-primary/20 shadow-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Real-Time Market Analysis
        </CardTitle>
        <CardDescription>
          Analyze live market data with AI-powered technical indicators
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Trading Pair
            </label>
            <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
              <SelectTrigger className="border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SYMBOLS.map((symbol) => (
                  <SelectItem key={symbol.value} value={symbol.value}>
                    {symbol.label} ({symbol.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Timeframe
            </label>
            <Select value={selectedInterval} onValueChange={setSelectedInterval}>
              <SelectTrigger className="border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTERVALS.map((interval) => (
                  <SelectItem key={interval.value} value={interval.value}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={handleAnalyze} 
          disabled={isAnalyzing}
          className="w-full h-12 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
        >
          {isAnalyzing ? (
            <>
              <Activity className="h-5 w-5 mr-2 animate-spin" />
              Analyzing Market...
            </>
          ) : (
            <>
              <TrendingUp className="h-5 w-5 mr-2" />
              Analyze {SYMBOLS.find(s => s.value === selectedSymbol)?.label}
            </>
          )}
        </Button>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">8+</div>
            <div className="text-xs text-muted-foreground">Indicators</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-accent">AI</div>
            <div className="text-xs text-muted-foreground">Powered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-bullish">Live</div>
            <div className="text-xs text-muted-foreground">Data</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeAnalysis;
