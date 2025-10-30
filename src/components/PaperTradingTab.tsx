import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Trade {
  id: string;
  symbol: string;
  asset_type: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  position_type: 'long' | 'short';
  status: 'open' | 'closed';
  pnl: number | null;
  pnl_percentage: number | null;
  opened_at: string;
  closed_at: string | null;
}

const PaperTradingTab = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTrade, setShowNewTrade] = useState(false);
  const [newTrade, setNewTrade] = useState({
    symbol: '',
    asset_type: 'crypto',
    entry_price: '',
    quantity: '',
    position_type: 'long' as 'long' | 'short',
  });

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      const { data, error } = await supabase
        .from('paper_trades')
        .select('*')
        .order('opened_at', { ascending: false });

      if (error) throw error;
      setTrades((data || []).map(t => ({
        ...t,
        position_type: t.position_type as 'long' | 'short',
        status: t.status as 'open' | 'closed',
      })));
    } catch (error) {
      console.error('Error fetching trades:', error);
      toast.error('Failed to load trades');
    } finally {
      setLoading(false);
    }
  };

  const openTrade = async () => {
    if (!newTrade.symbol || !newTrade.entry_price || !newTrade.quantity) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('paper_trades').insert({
        user_id: user.id,
        symbol: newTrade.symbol,
        asset_type: newTrade.asset_type,
        entry_price: parseFloat(newTrade.entry_price),
        quantity: parseFloat(newTrade.quantity),
        position_type: newTrade.position_type,
        status: 'open',
      });

      if (error) throw error;

      toast.success('Trade opened successfully');
      setShowNewTrade(false);
      setNewTrade({
        symbol: '',
        asset_type: 'crypto',
        entry_price: '',
        quantity: '',
        position_type: 'long',
      });
      fetchTrades();
    } catch (error) {
      console.error('Error opening trade:', error);
      toast.error('Failed to open trade');
    }
  };

  const closeTrade = async (trade: Trade, exitPrice: number) => {
    try {
      const pnl = trade.position_type === 'long'
        ? (exitPrice - trade.entry_price) * trade.quantity
        : (trade.entry_price - exitPrice) * trade.quantity;
      
      const pnl_percentage = (pnl / (trade.entry_price * trade.quantity)) * 100;

      const { error } = await supabase
        .from('paper_trades')
        .update({
          exit_price: exitPrice,
          status: 'closed',
          pnl,
          pnl_percentage,
          closed_at: new Date().toISOString(),
        })
        .eq('id', trade.id);

      if (error) throw error;

      toast.success('Trade closed successfully');
      fetchTrades();
    } catch (error) {
      console.error('Error closing trade:', error);
      toast.error('Failed to close trade');
    }
  };

  const calculatePortfolioValue = () => {
    const closedTrades = trades.filter(t => t.status === 'closed');
    const totalPnL = closedTrades.reduce((acc, t) => acc + (t.pnl || 0), 0);
    return { totalPnL, tradesCount: closedTrades.length };
  };

  const portfolio = calculatePortfolioValue();

  if (loading) {
    return <div className="animate-pulse bg-muted h-64 rounded-lg" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-primary" />
            Paper Trading
          </h2>
          <p className="text-muted-foreground text-sm">Practice trading without risk</p>
        </div>
        <Button onClick={() => setShowNewTrade(!showNewTrade)}>
          {showNewTrade ? 'Cancel' : 'New Trade'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total P&L</div>
          <div className={`text-2xl font-bold ${portfolio.totalPnL >= 0 ? 'text-bullish' : 'text-bearish'}`}>
            ${portfolio.totalPnL.toFixed(2)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Total Trades</div>
          <div className="text-2xl font-bold">{portfolio.tradesCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Open Positions</div>
          <div className="text-2xl font-bold">
            {trades.filter(t => t.status === 'open').length}
          </div>
        </Card>
      </div>

      {showNewTrade && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Open New Trade</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Symbol</Label>
              <Input
                placeholder="BTC/USD"
                value={newTrade.symbol}
                onChange={(e) => setNewTrade({ ...newTrade, symbol: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Asset Type</Label>
              <Select value={newTrade.asset_type} onValueChange={(v) => setNewTrade({ ...newTrade, asset_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="forex">Forex</SelectItem>
                  <SelectItem value="stocks">Stocks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Entry Price</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={newTrade.entry_price}
                onChange={(e) => setNewTrade({ ...newTrade, entry_price: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={newTrade.quantity}
                onChange={(e) => setNewTrade({ ...newTrade, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Position Type</Label>
              <Select value={newTrade.position_type} onValueChange={(v: 'long' | 'short') => setNewTrade({ ...newTrade, position_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={openTrade} className="w-full mt-4">
            Open Trade
          </Button>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Your Trades</h3>
        {trades.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No trades yet. Start by opening your first trade!
          </Card>
        ) : (
          trades.map((trade) => (
            <Card key={trade.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{trade.symbol}</h4>
                    <Badge variant={trade.position_type === 'long' ? 'default' : 'secondary'}>
                      {trade.position_type === 'long' ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {trade.position_type.toUpperCase()}
                    </Badge>
                    <Badge variant={trade.status === 'open' ? 'default' : 'outline'}>
                      {trade.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Entry: </span>
                      ${trade.entry_price}
                    </div>
                    {trade.exit_price && (
                      <div>
                        <span className="text-muted-foreground">Exit: </span>
                        ${trade.exit_price}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Qty: </span>
                      {trade.quantity}
                    </div>
                    {trade.pnl !== null && (
                      <div className={trade.pnl >= 0 ? 'text-bullish' : 'text-bearish'}>
                        P&L: ${trade.pnl.toFixed(2)} ({trade.pnl_percentage?.toFixed(2)}%)
                      </div>
                    )}
                  </div>
                </div>
                {trade.status === 'open' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const exitPrice = prompt('Enter exit price:');
                      if (exitPrice) closeTrade(trade, parseFloat(exitPrice));
                    }}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Close
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PaperTradingTab;
