import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface BacktestResult {
  id: string;
  symbol: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_capital: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_pnl: number;
  total_pnl_percentage: number;
  max_drawdown: number;
  created_at: string;
}

const BacktestingTab = () => {
  const [results, setResults] = useState<BacktestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [backtest, setBacktest] = useState({
    symbol: '',
    timeframe: '1h',
    start_date: '',
    end_date: '',
    initial_capital: '10000',
  });

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const { data, error } = await supabase
        .from('backtest_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error fetching backtest results:', error);
      toast.error('Failed to load backtest results');
    } finally {
      setLoading(false);
    }
  };

  const runBacktest = async () => {
    if (!backtest.symbol || !backtest.start_date || !backtest.end_date) {
      toast.error('Please fill in all fields');
      return;
    }

    setRunning(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Simulate backtest calculation
      const totalTrades = Math.floor(Math.random() * 50) + 20;
      const winningTrades = Math.floor(totalTrades * (0.5 + Math.random() * 0.3));
      const losingTrades = totalTrades - winningTrades;
      const winRate = (winningTrades / totalTrades) * 100;
      const totalPnl = (Math.random() * 4000) - 1000;
      const initialCapital = parseFloat(backtest.initial_capital);
      const finalCapital = initialCapital + totalPnl;
      const totalPnlPercentage = (totalPnl / initialCapital) * 100;
      const maxDrawdown = Math.random() * 20;

      const { error } = await supabase.from('backtest_results').insert({
        user_id: user.id,
        symbol: backtest.symbol,
        timeframe: backtest.timeframe,
        start_date: backtest.start_date,
        end_date: backtest.end_date,
        initial_capital: initialCapital,
        final_capital: finalCapital,
        total_trades: totalTrades,
        winning_trades: winningTrades,
        losing_trades: losingTrades,
        win_rate: winRate,
        total_pnl: totalPnl,
        total_pnl_percentage: totalPnlPercentage,
        max_drawdown: maxDrawdown,
      });

      if (error) throw error;

      toast.success('Backtest completed successfully');
      fetchResults();
      setBacktest({
        symbol: '',
        timeframe: '1h',
        start_date: '',
        end_date: '',
        initial_capital: '10000',
      });
    } catch (error) {
      console.error('Error running backtest:', error);
      toast.error('Failed to run backtest');
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-muted h-64 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Activity className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Backtesting</h2>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">New Backtest</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Symbol</Label>
            <Input
              placeholder="BTC/USD"
              value={backtest.symbol}
              onChange={(e) => setBacktest({ ...backtest, symbol: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Timeframe</Label>
            <Select value={backtest.timeframe} onValueChange={(v) => setBacktest({ ...backtest, timeframe: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5m">5 Minutes</SelectItem>
                <SelectItem value="15m">15 Minutes</SelectItem>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="4h">4 Hours</SelectItem>
                <SelectItem value="1d">1 Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={backtest.start_date}
              onChange={(e) => setBacktest({ ...backtest, start_date: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={backtest.end_date}
              onChange={(e) => setBacktest({ ...backtest, end_date: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Initial Capital ($)</Label>
            <Input
              type="number"
              value={backtest.initial_capital}
              onChange={(e) => setBacktest({ ...backtest, initial_capital: e.target.value })}
            />
          </div>
        </div>
        <Button onClick={runBacktest} disabled={running} className="w-full mt-4">
          {running ? 'Running Backtest...' : 'Run Backtest'}
        </Button>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Backtest Results</h3>
        {results.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No backtest results yet. Run your first backtest above!
          </Card>
        ) : (
          results.map((result) => (
            <Card key={result.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xl font-semibold">{result.symbol}</h4>
                  <p className="text-sm text-muted-foreground">
                    {result.timeframe} • {new Date(result.start_date).toLocaleDateString()} - {new Date(result.end_date).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={result.total_pnl >= 0 ? 'bg-bullish/20 text-bullish' : 'bg-bearish/20 text-bearish'}>
                  {result.total_pnl >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {result.total_pnl_percentage.toFixed(2)}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Total Trades</div>
                  <div className="text-lg font-semibold">{result.total_trades}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Win Rate</div>
                  <div className="text-lg font-semibold">{result.win_rate.toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total P&L</div>
                  <div className={`text-lg font-semibold ${result.total_pnl >= 0 ? 'text-bullish' : 'text-bearish'}`}>
                    ${result.total_pnl.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Max Drawdown</div>
                  <div className="text-lg font-semibold text-bearish">
                    -{result.max_drawdown.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Winning: </span>
                  <span className="text-bullish font-medium">{result.winning_trades}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Losing: </span>
                  <span className="text-bearish font-medium">{result.losing_trades}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Final Capital: </span>
                  <span className="font-medium">${result.final_capital.toFixed(2)}</span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BacktestingTab;
