import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Activity, BarChart3, Target, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface PerformanceStats {
  totalSignals: number;
  successfulSignals: number;
  winRate: number;
  avgPnL: number;
  maxDrawdown: number;
  sharpeRatio: number;
  buySignals: number;
  sellSignals: number;
  recentPerformance: Array<{ date: string; winRate: number; pnl: number }>;
}

const PerformanceBar = () => {
  const [stats, setStats] = useState<PerformanceStats>({
    totalSignals: 0,
    successfulSignals: 0,
    winRate: 0,
    avgPnL: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    buySignals: 0,
    sellSignals: 0,
    recentPerformance: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceStats();
  }, []);

  const fetchPerformanceStats = async () => {
    try {
      const { data: analyses } = await supabase
        .from('chart_analyses')
        .select('signal, actual_outcome, outcome_pnl, created_at')
        .order('created_at', { ascending: false });

      if (analyses) {
        const verifiedAnalyses = analyses.filter(a => a.actual_outcome !== null);
        const total = verifiedAnalyses.length;
        const successful = verifiedAnalyses.filter(a => a.actual_outcome === 'success').length;
        const avgPnL = verifiedAnalyses.reduce((acc, a) => acc + (a.outcome_pnl || 0), 0) / (total || 1);
        
        // Calculate max drawdown
        let peak = 0;
        let maxDrawdown = 0;
        let cumulative = 0;
        verifiedAnalyses.forEach(a => {
          cumulative += a.outcome_pnl || 0;
          if (cumulative > peak) peak = cumulative;
          const drawdown = ((peak - cumulative) / (peak || 1)) * 100;
          if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        });

        // Calculate Sharpe ratio (simplified)
        const returns = verifiedAnalyses.map(a => a.outcome_pnl || 0);
        const avgReturn = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
        const stdDev = Math.sqrt(returns.reduce((acc, r) => acc + Math.pow(r - avgReturn, 2), 0) / (returns.length || 1));
        const sharpeRatio = stdDev !== 0 ? (avgReturn / stdDev) : 0;

        // Count signal types
        const buySignals = analyses.filter(a => a.signal === 'BUY').length;
        const sellSignals = analyses.filter(a => a.signal === 'SELL').length;

        // Recent performance (last 7 days grouped)
        const last7Days = verifiedAnalyses.slice(0, Math.min(7, verifiedAnalyses.length));
        const recentPerformance = last7Days.map((a, i) => ({
          date: new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          winRate: verifiedAnalyses.slice(i, i + 5).filter(x => x.actual_outcome === 'success').length / 5 * 100,
          pnl: a.outcome_pnl || 0
        }));

        setStats({
          totalSignals: total,
          successfulSignals: successful,
          winRate: total > 0 ? (successful / total) * 100 : 0,
          avgPnL: avgPnL,
          maxDrawdown,
          sharpeRatio,
          buySignals,
          sellSignals,
          recentPerformance,
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

  const pieData = [
    { name: 'Buy Signals', value: stats.buySignals, color: 'hsl(var(--bullish))' },
    { name: 'Sell Signals', value: stats.sellSignals, color: 'hsl(var(--bearish))' },
  ];

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-background to-secondary/20 border-border shadow-card hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Win Rate</span>
            </div>
            <Award className="h-4 w-4 text-primary/50" />
          </div>
          <div className="text-3xl font-bold mb-2">{stats.winRate.toFixed(1)}%</div>
          <Progress value={stats.winRate} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">{stats.successfulSignals} of {stats.totalSignals} signals</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-background to-secondary/20 border-border shadow-card hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-bullish" />
              <span className="text-sm text-muted-foreground">Avg P&L</span>
            </div>
          </div>
          <div className={`text-3xl font-bold mb-2 ${stats.avgPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
            {stats.avgPnL >= 0 ? '+' : ''}{stats.avgPnL.toFixed(2)}%
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {stats.avgPnL >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            Per signal average
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-background to-secondary/20 border-border shadow-card hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-accent" />
              <span className="text-sm text-muted-foreground">Sharpe Ratio</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2">{stats.sharpeRatio.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">Risk-adjusted returns</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-background to-secondary/20 border-border shadow-card hover:shadow-glow transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-bearish" />
              <span className="text-sm text-muted-foreground">Max Drawdown</span>
            </div>
          </div>
          <div className="text-3xl font-bold mb-2 text-bearish">-{stats.maxDrawdown.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">Peak to trough decline</p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trend Chart */}
        <Card className="p-6 bg-gradient-to-br from-background to-secondary/20 border-border shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Performance Trend</h3>
          </div>
          {stats.recentPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stats.recentPerformance}>
                <defs>
                  <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area type="monotone" dataKey="pnl" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPnl)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No performance data yet
            </div>
          )}
        </Card>

        {/* Signal Distribution */}
        <Card className="p-6 bg-gradient-to-br from-background to-secondary/20 border-border shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Signal Distribution</h3>
          </div>
          {stats.buySignals + stats.sellSignals > 0 ? (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="ml-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-bullish" />
                  <span className="text-sm">Buy: {stats.buySignals}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-bearish" />
                  <span className="text-sm">Sell: {stats.sellSignals}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              No signals yet
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PerformanceBar;
