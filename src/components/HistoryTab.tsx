import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import AnalysisResult from "@/components/AnalysisResult";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Analysis {
  id: string;
  signal: string;
  confidence: number;
  asset_type: string;
  market_condition: string;
  created_at: string;
  image_url: string;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  pattern_details: string;
  indicators_analysis: string;
  ai_commentary: string;
  title: string | null;
  user_id: string | null;
  actual_outcome: string | null;
  outcome_verified_at: string | null;
  outcome_pnl: number | null;
}

export default function HistoryTab() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chart_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Analysis deleted successfully');
      fetchHistory();
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast.error('Failed to delete analysis');
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

  if (selectedAnalysis) {
    return (
      <div className="space-y-6">
        <Button 
          onClick={() => setSelectedAnalysis(null)} 
          variant="outline"
        >
          ← Back to History
        </Button>
        <AnalysisResult 
          analysis={{
            signal: selectedAnalysis.signal,
            confidence: selectedAnalysis.confidence,
            entry_price: selectedAnalysis.entry_price,
            stop_loss: selectedAnalysis.stop_loss,
            take_profit: selectedAnalysis.take_profit,
            market_condition: selectedAnalysis.market_condition,
            pattern_details: selectedAnalysis.pattern_details,
            indicators_analysis: selectedAnalysis.indicators_analysis,
            ai_commentary: selectedAnalysis.ai_commentary,
          }}
          imageUrl={selectedAnalysis.image_url}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Analysis History
        </h2>
        <p className="text-muted-foreground mt-2">Review your past chart analyses and insights</p>
      </div>
      
      <div className="grid gap-4">
        {analyses.map((analysis) => (
          <Card 
            key={analysis.id} 
            className="group overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow"
          >
            <div className="flex items-start gap-4 p-6">
              <div 
                className="relative w-32 h-32 rounded-xl overflow-hidden cursor-pointer flex-shrink-0 ring-2 ring-border group-hover:ring-primary/50 transition-all"
                onClick={() => setSelectedAnalysis(analysis)}
              >
                <img
                  src={analysis.image_url}
                  alt="Chart thumbnail"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedAnalysis(analysis)}>
                {analysis.title && (
                  <h3 className="font-semibold text-xl mb-3 text-foreground group-hover:text-primary transition-colors">
                    {analysis.title}
                  </h3>
                )}
                
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                    analysis.signal === 'BUY' 
                      ? 'bg-bullish/10 text-bullish' 
                      : analysis.signal === 'SELL'
                      ? 'bg-bearish/10 text-bearish'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {getSignalIcon(analysis.signal)}
                    <span className="font-bold text-sm">{analysis.signal}</span>
                  </div>
                  
                  <Badge variant="outline" className="font-semibold">
                    {analysis.confidence}% Confidence
                  </Badge>
                  
                  {analysis.actual_outcome && (
                    <Badge 
                      variant={analysis.actual_outcome === 'win' ? 'default' : 'destructive'}
                      className="capitalize"
                    >
                      {analysis.actual_outcome}
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="capitalize font-medium">{analysis.asset_type}</span>
                  <span>•</span>
                  <span className="capitalize">{analysis.market_condition}</span>
                  <span>•</span>
                  <span>{new Date(analysis.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                  
                  {analysis.outcome_pnl && (
                    <>
                      <span>•</span>
                      <span className={analysis.outcome_pnl > 0 ? 'text-bullish font-semibold' : 'text-bearish font-semibold'}>
                        {analysis.outcome_pnl > 0 ? '+' : ''}{analysis.outcome_pnl.toFixed(2)}%
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this analysis? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDelete(analysis.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}