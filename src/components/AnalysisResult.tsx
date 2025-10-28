import { TrendingUp, TrendingDown, Minus, Target, Shield, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  };
  imageUrl: string;
}

export default function AnalysisResult({ analysis, imageUrl }: AnalysisResultProps) {
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
      {/* Chart Preview */}
      <Card className="overflow-hidden shadow-card border-border">
        <img src={imageUrl} alt="Analyzed chart" className="w-full h-auto" />
      </Card>

      {/* Signal Card */}
      <Card className={`p-8 shadow-card border-border ${getSignalColor(analysis.signal)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getSignalIcon(analysis.signal)}
            <div>
              <h3 className="text-3xl font-bold">{analysis.signal}</h3>
              <p className="text-sm opacity-90">Trading Signal</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{analysis.confidence}%</div>
            <p className="text-sm opacity-90">Confidence</p>
          </div>
        </div>
        <div className="mt-4">
          <Progress value={analysis.confidence} className="h-2" />
        </div>
      </Card>

      {/* Key Levels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {analysis.entry_price && (
          <Card className="p-6 shadow-card border-border">
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <h4 className="font-semibold">Entry Price</h4>
            </div>
            <p className="text-2xl font-bold">{analysis.entry_price.toFixed(5)}</p>
          </Card>
        )}
        
        {analysis.stop_loss && (
          <Card className="p-6 shadow-card border-border">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-5 w-5 text-bearish" />
              <h4 className="font-semibold">Stop Loss</h4>
            </div>
            <p className="text-2xl font-bold">{analysis.stop_loss.toFixed(5)}</p>
          </Card>
        )}
        
        {analysis.take_profit && (
          <Card className="p-6 shadow-card border-border">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="h-5 w-5 text-bullish" />
              <h4 className="font-semibold">Take Profit</h4>
            </div>
            <p className="text-2xl font-bold">{analysis.take_profit.toFixed(5)}</p>
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