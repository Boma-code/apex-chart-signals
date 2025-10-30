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
}

export default function HistoryTab() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    fetchHistory();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });
    
    setIsAdmin(data || false);
  };

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('chart_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(isAdmin ? 50 : 10);

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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">
          {isAdmin ? "Admin Panel - All Analyses" : "Analysis History"}
        </h2>
        {isAdmin && (
          <Badge variant="destructive">Admin Mode</Badge>
        )}
      </div>
      <div className="grid gap-4">
        {analyses.map((analysis) => (
          <Card 
            key={analysis.id} 
            className="p-6 shadow-card border-border hover:border-primary transition-colors"
          >
            <div className="flex items-start gap-4">
              <img
                src={analysis.image_url}
                alt="Chart thumbnail"
                className="w-24 h-24 object-cover rounded-lg cursor-pointer"
                onClick={() => setSelectedAnalysis(analysis)}
              />
              <div className="flex-1 cursor-pointer" onClick={() => setSelectedAnalysis(analysis)}>
                {analysis.title && (
                  <h3 className="font-semibold text-lg mb-2">{analysis.title}</h3>
                )}
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
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
                    <AlertDialogAction onClick={() => handleDelete(analysis.id)}>
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