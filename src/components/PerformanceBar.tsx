import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PerformanceStats {
  totalSignals: number;
  successfulSignals: number;
  winRate: number;
  avgPnL: number;
}

const PerformanceBar = () => {
  const [stats, setStats] = useState<PerformanceStats>({
    totalSignals: 0,
    successfulSignals: 0,
    winRate: 0,
    avgPnL: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceStats();
  }, []);

  const fetchPerformanceStats = async () => {
    try {
      const { data: analyses } = await supabase
        .from('chart_analyses')
        .select('actual_outcome, outcome_pnl')
        .not('actual_outcome', 'is', null);

      if (analyses) {
        const total = analyses.length;
        const successful = analyses.filter(a => a.actual_outcome === 'success').length;
        const avgPnL = analyses.reduce((acc, a) => acc + (a.outcome_pnl || 0), 0) / (total || 1);

        setStats({
          totalSignals: total,
          successfulSignals: successful,
          winRate: total > 0 ? (successful / total) * 100 : 0,
          avgPnL: avgPnL,
        });
      }
    } catch (error) {
      console.error('Error fetching performance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-muted h-32 rounded-lg" />;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Signal Performance</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Win Rate</span>
            <span className="font-bold text-lg">{stats.winRate.toFixed(1)}%</span>
          </div>
          <Progress value={stats.winRate} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Signals</span>
            <span className="font-bold text-lg">{stats.totalSignals}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-bullish" />
            {stats.successfulSignals} successful
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Avg P&L</span>
            <span className={`font-bold text-lg ${stats.avgPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
              {stats.avgPnL >= 0 ? '+' : ''}{stats.avgPnL.toFixed(2)}%
            </span>
          </div>
          <div className="flex items-center gap-1">
            {stats.avgPnL >= 0 ? (
              <TrendingUp className="h-3 w-3 text-bullish" />
            ) : (
              <TrendingDown className="h-3 w-3 text-bearish" />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PerformanceBar;
