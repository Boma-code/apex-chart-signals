import { TrendingUp, TrendingDown, Minus, Target, Shield, DollarSign, AlertTriangle, BarChart3, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";

interface AnalysisResultProps {
  analysis: {
    signal: string;
    confidence: number;
    entry_price: number | null;
    stop_loss: number | null;
    take_profit: number | null;
    market_condition: string;
    pattern_details: string;
    indicators_analysis: string;
    ai_commentary: string;
    marketData?: {
      symbol: string;
      currentPrice: number;
      priceChange24h: number;
      indicators: {
        ema20: number;
        ema50: number;
        rsi: number;
        macd: {
          macd: number;
          signal: number;
          histogram: number;
        };
        bollingerBands: {
          upper: number;
          middle: number;
          lower: number;
        };
        vwap: number;
      };
    };
  };
  imageUrl: string | null;
}

export default function AnalysisResult({ analysis, imageUrl }: AnalysisResultProps) {
  // Calculate Risk-to-Reward Ratio
  const riskRewardRatio = useMemo(() => {
    if (!analysis.entry_price || !analysis.stop_loss || !analysis.take_profit) return null;
    const risk = Math.abs(analysis.entry_price - analysis.stop_loss);
    const reward = Math.abs(analysis.take_profit - analysis.entry_price);
    return risk > 0 ? (reward / risk).toFixed(2) : null;
  }, [analysis.entry_price, analysis.stop_loss, analysis.take_profit]);

  // Calculate potential profit/loss percentages
  const potentialProfit = useMemo(() => {
    if (!analysis.entry_price || !analysis.take_profit) return null;
    return (((analysis.take_profit - analysis.entry_price) / analysis.entry_price) * 100).toFixed(2);
  }, [analysis.entry_price, analysis.take_profit]);

  const potentialLoss = useMemo(() => {
    if (!analysis.entry_price || !analysis.stop_loss) return null;
    return (((analysis.entry_price - analysis.stop_loss) / analysis.entry_price) * 100).toFixed(2);
  }, [analysis.entry_price, analysis.stop_loss]);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "BUY":
        return "bg-gradient-bullish text-bullish-foreground";
      case "SELL":
        return "bg-gradient-bearish text-bearish-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case "BUY":
        return <TrendingUp className="h-6 w-6" />;
      case "SELL":
        return <TrendingDown className="h-6 w-6" />;
      default:
        return <Minus className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Chart Preview or Market Data */}
      {imageUrl ? (
        <Card className="overflow-hidden shadow-card border-border">
          <img src={imageUrl} alt="Analyzed chart" className="w-full h-auto" />
        </Card>
      ) : analysis.marketData && (
        <Card className="p-6 shadow-card border-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{analysis.marketData.symbol}</h3>
                <p className="text-sm text-muted-foreground">Real-Time Market Analysis</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">${analysis.marketData.currentPrice.toLocaleString()}</div>
                <Badge variant={analysis.marketData.priceChange24h >= 0 ? "default" : "destructive"}>
                  {analysis.marketData.priceChange24h >= 0 ? "+" : ""}{analysis.marketData.priceChange24h.toFixed(2)}%
                </Badge>
              </div>
            </div>

            {/* Technical Indicators Display */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">EMA 20</p>
                <p className="text-sm font-semibold">${analysis.marketData.indicators.ema20.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">EMA 50</p>
                <p className="text-sm font-semibold">${analysis.marketData.indicators.ema50.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">RSI (14)</p>
                <p className="text-sm font-semibold">{analysis.marketData.indicators.rsi.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">VWAP</p>
                <p className="text-sm font-semibold">${analysis.marketData.indicators.vwap.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">BB Upper</p>
                <p className="text-sm font-semibold">${analysis.marketData.indicators.bollingerBands.upper.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">BB Middle</p>
                <p className="text-sm font-semibold">${analysis.marketData.indicators.bollingerBands.middle.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">BB Lower</p>
                <p className="text-sm font-semibold">${analysis.marketData.indicators.bollingerBands.lower.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Signal Card with Enhanced Metrics */}
      <Card className={`p-8 shadow-glow border-2 ${getSignalColor(analysis.signal)}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {getSignalIcon(analysis.signal)}
              <div>
                <h3 className="text-4xl font-bold">{analysis.signal}</h3>
                <p className="text-sm opacity-90">Trading Signal</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{analysis.confidence}%</div>
              <p className="text-sm opacity-90">Confidence Score</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-90">Signal Strength</span>
              <Badge variant={analysis.confidence >= 80 ? "default" : analysis.confidence >= 60 ? "secondary" : "outline"}>
                {analysis.confidence >= 80 ? "Very Strong" : analysis.confidence >= 60 ? "Strong" : "Moderate"}
              </Badge>
            </div>
            <Progress value={analysis.confidence} className="h-3" />
          </div>

          {/* Risk-Reward Display */}
          {riskRewardRatio && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="text-center">
                <BarChart3 className="h-5 w-5 mx-auto mb-1 opacity-75" />
                <div className="text-2xl font-bold">{riskRewardRatio}:1</div>
                <p className="text-xs opacity-75">Risk/Reward</p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-5 w-5 mx-auto mb-1 opacity-75" />
                <div className="text-2xl font-bold">+{potentialProfit}%</div>
                <p className="text-xs opacity-75">Potential Gain</p>
              </div>
              <div className="text-center">
                <TrendingDown className="h-5 w-5 mx-auto mb-1 opacity-75" />
                <div className="text-2xl font-bold">-{potentialLoss}%</div>
                <p className="text-xs opacity-75">Potential Loss</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Enhanced Key Levels with Visual Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analysis.entry_price && (
          <Card className="p-6 shadow-card border-border bg-gradient-to-br from-card to-primary/5 hover:shadow-glow transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h4 className="font-semibold">Entry Price</h4>
            </div>
            <p className="text-3xl font-bold mb-2">{analysis.entry_price.toFixed(5)}</p>
            <Badge variant="outline" className="text-xs">Recommended entry point</Badge>
          </Card>
        )}
        
        {analysis.stop_loss && (
          <Card className="p-6 shadow-card border-border bg-gradient-to-br from-card to-bearish/5 hover:shadow-glow transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-bearish/20">
                <Shield className="h-5 w-5 text-bearish" />
              </div>
              <h4 className="font-semibold">Stop Loss</h4>
            </div>
            <p className="text-3xl font-bold mb-2">{analysis.stop_loss.toFixed(5)}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <AlertTriangle className="h-3 w-3" />
              <span>Risk management level</span>
            </div>
          </Card>
        )}
        
        {analysis.take_profit && (
          <Card className="p-6 shadow-card border-border bg-gradient-to-br from-card to-bullish/5 hover:shadow-glow transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-bullish/20">
                <DollarSign className="h-5 w-5 text-bullish" />
              </div>
              <h4 className="font-semibold">Take Profit</h4>
            </div>
            <p className="text-3xl font-bold mb-2">{analysis.take_profit.toFixed(5)}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Percent className="h-3 w-3" />
              <span>Target profit level</span>
            </div>
          </Card>
        )}
      </div>

      {/* Market Condition */}
      <Card className="p-6 shadow-card border-border">
        <div className="flex items-center gap-2 mb-3">
          <h4 className="font-semibold">Market Condition</h4>
          <Badge variant="outline">{analysis.market_condition}</Badge>
        </div>
      </Card>

      {/* Pattern Details */}
      {analysis.pattern_details && (
        <Card className="p-6 shadow-card border-border">
          <h4 className="font-semibold mb-3">Chart Patterns</h4>
          <p className="text-muted-foreground leading-relaxed">{analysis.pattern_details}</p>
        </Card>
      )}

      {/* Indicators Analysis */}
      {analysis.indicators_analysis && (
        <Card className="p-6 shadow-card border-border">
          <h4 className="font-semibold mb-3">Technical Indicators</h4>
          <p className="text-muted-foreground leading-relaxed">{analysis.indicators_analysis}</p>
        </Card>
      )}

      {/* AI Commentary */}
      <Card className="p-6 shadow-card border-border bg-secondary/50">
        <h4 className="font-semibold mb-3">AI Analysis Summary</h4>
        <p className="text-foreground leading-relaxed whitespace-pre-line">{analysis.ai_commentary}</p>
      </Card>
    </div>
  );
}