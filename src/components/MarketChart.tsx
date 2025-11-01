import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MarketChartProps {
  marketData: {
    symbol: string;
    currentPrice: number;
    change24h: number;
    candles: Array<{
      timestamp: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    }>;
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
  analysis: {
    signal: string;
    entry_price: number | null;
    stop_loss: number | null;
    take_profit: number | null;
  };
}

const MarketChart = ({ marketData, analysis }: MarketChartProps) => {
  // Take last 20 candles for better visualization
  const chartData = marketData.candles.slice(-20).map((candle) => ({
    time: new Date(candle.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: candle.close,
    volume: candle.volume,
  }));

  const isPositive = marketData.change24h >= 0;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-bullish" />
            ) : (
              <TrendingDown className="h-5 w-5 text-bearish" />
            )}
            {marketData.symbol} Chart
          </CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold">${marketData.currentPrice.toFixed(2)}</div>
            <div className={`text-sm ${isPositive ? 'text-bullish' : 'text-bearish'}`}>
              {isPositive ? '+' : ''}{marketData.change24h.toFixed(2)}%
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Chart */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="time" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                domain={['auto', 'auto']}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              
              {/* Reference lines for entry, stop loss, and take profit */}
              {analysis.entry_price && (
                <ReferenceLine 
                  y={analysis.entry_price} 
                  stroke="hsl(var(--primary))" 
                  strokeDasharray="3 3"
                  label={{ value: 'Entry', position: 'right', fill: 'hsl(var(--primary))' }}
                />
              )}
              {analysis.stop_loss && (
                <ReferenceLine 
                  y={analysis.stop_loss} 
                  stroke="hsl(var(--bearish))" 
                  strokeDasharray="3 3"
                  label={{ value: 'Stop Loss', position: 'right', fill: 'hsl(var(--bearish))' }}
                />
              )}
              {analysis.take_profit && (
                <ReferenceLine 
                  y={analysis.take_profit} 
                  stroke="hsl(var(--bullish))" 
                  strokeDasharray="3 3"
                  label={{ value: 'Take Profit', position: 'right', fill: 'hsl(var(--bullish))' }}
                />
              )}
              
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
                name="Price"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Technical Indicators Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">RSI</div>
            <div className={`text-lg font-bold ${
              marketData.indicators.rsi > 70 ? 'text-bearish' : 
              marketData.indicators.rsi < 30 ? 'text-bullish' : 
              'text-foreground'
            }`}>
              {marketData.indicators.rsi.toFixed(2)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">EMA 20</div>
            <div className="text-lg font-bold">${marketData.indicators.ema20.toFixed(2)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">EMA 50</div>
            <div className="text-lg font-bold">${marketData.indicators.ema50.toFixed(2)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">VWAP</div>
            <div className="text-lg font-bold">${marketData.indicators.vwap.toFixed(2)}</div>
          </div>
        </div>

        {/* Bollinger Bands */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Bollinger Bands</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Upper</div>
              <div className="font-mono">${marketData.indicators.bollingerBands.upper.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Middle</div>
              <div className="font-mono">${marketData.indicators.bollingerBands.middle.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Lower</div>
              <div className="font-mono">${marketData.indicators.bollingerBands.lower.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* MACD */}
        <div className="space-y-2">
          <div className="text-sm font-medium">MACD</div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">MACD</div>
              <div className={`font-mono ${marketData.indicators.macd.macd > 0 ? 'text-bullish' : 'text-bearish'}`}>
                {marketData.indicators.macd.macd.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Signal</div>
              <div className="font-mono">{marketData.indicators.macd.signal.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Histogram</div>
              <div className={`font-mono ${marketData.indicators.macd.histogram > 0 ? 'text-bullish' : 'text-bearish'}`}>
                {marketData.indicators.macd.histogram.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketChart;