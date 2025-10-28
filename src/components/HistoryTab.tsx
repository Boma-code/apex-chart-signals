import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

interface Analysis {
  id: string;
  signal: string;
  confidence: number;
  asset_type: string;
  market_condition: string;
  created_at: string;
  image_url: string;
}

export default function HistoryTab() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_analyses')
        .select('id, signal, confidence, asset_type, market_condition, created_at, image_url')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case "BUY":
        return <TrendingUp className="h-4 w-4 text-bullish" />;
      case "SELL":
        return <TrendingDown className="h-4 w-4 text-bearish" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading history...</div>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Analysis History</h3>
        <p className="text-muted-foreground">Your analyzed charts will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Analysis History</h2>
      <div className="grid gap-4">
        {analyses.map((analysis) => (
          <Card key={analysis.id} className="p-6 shadow-card border-border hover:border-primary transition-colors">
            <div className="flex items-start gap-4">
              <img
                src={analysis.image_url}
                alt="Chart thumbnail"
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getSignalIcon(analysis.signal)}
                  <span className="font-bold text-lg">{analysis.signal}</span>
                  <Badge variant="outline" className="ml-auto">
                    {analysis.confidence}%
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="capitalize">{analysis.asset_type}</span>
                  <span>•</span>
                  <span>{analysis.market_condition}</span>
                  <span>•</span>
                  <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}