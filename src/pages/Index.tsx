import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Crown, Home, History as HistoryIcon, User, LogOut, Newspaper, DollarSign, Activity } from "lucide-react";
import { toast } from "sonner";
import UploadSection from "@/components/UploadSection";
import AnalysisResult from "@/components/AnalysisResult";
import HistoryTab from "@/components/HistoryTab";
import LoadingAnalysis from "@/components/LoadingAnalysis";
import Footer from "@/components/Footer";
import PremiumTab from "@/components/PremiumTab";
import PerformanceBar from "@/components/PerformanceBar";
import NewsTab from "@/components/NewsTab";
import PaperTradingTab from "@/components/PaperTradingTab";
import BacktestingTab from "@/components/BacktestingTab";
import RealTimeAnalysis from "@/components/RealTimeAnalysis";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-trading.jpg";
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface AnalysisData {
  signal: string;
  confidence: number;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  market_condition: string;
  pattern_details: string;
  indicators_analysis: string;
  ai_commentary: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const handleImageSelected = async (image: File, assetType: string, title?: string) => {
    if (!user) {
      toast.error("Please sign in to analyze charts");
      navigate("/auth");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setCurrentImageUrl(base64Image);

        try {
          // Call edge function
          const { data, error } = await supabase.functions.invoke('analyze-chart', {
            body: { imageUrl: base64Image, assetType }
          });

          if (error) throw error;

          // Save to database
          const { error: dbError } = await supabase
            .from('chart_analyses')
            .insert({
              user_id: user.id,
              image_url: base64Image,
              asset_type: assetType,
              signal: data.signal,
              confidence: data.confidence,
              entry_price: data.entry_price,
              stop_loss: data.stop_loss,
              take_profit: data.take_profit,
              market_condition: data.market_condition,
              pattern_details: data.pattern_details,
              indicators_analysis: data.indicators_analysis,
              ai_commentary: data.ai_commentary,
              title: title || null,
            });

          if (dbError) {
            console.error('Database error:', dbError);
            toast.error('Failed to save analysis. Please try again.');
            return;
          }

          setAnalysisResult(data);
          toast.success('Chart analyzed successfully!');
        } catch (error) {
          console.error('Analysis error:', error);
          toast.error('Failed to analyze chart. Please try again.');
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(image);
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error('Failed to process image');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Auth Button */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        {user ? (
          <>
            <Button variant="outline" className="bg-background/80 backdrop-blur-sm">
              <User className="h-4 w-4 mr-2" />
              {user.email}
            </Button>
            <Button 
              variant="outline" 
              className="bg-background/80 backdrop-blur-sm"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </>
        ) : (
          <Button 
            variant="outline" 
            className="bg-background/80 backdrop-blur-sm"
            onClick={() => navigate("/auth")}
          >
            <User className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        )}
      </div>
      
      {/* Hero Section */}
      {!analysisResult && activeTab === "home" && (
        <div className="relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-hero backdrop-blur-[2px]" />
          
          <div className="relative container mx-auto px-4 py-24 md:py-32 text-center">
            <div className="inline-block px-4 py-1 mb-6 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm text-primary font-medium">Professional Trading Intelligence</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-primary animate-pulse">
              Chart Signal Pro
            </h1>
            <p className="text-xl md:text-2xl text-foreground/80 mb-12 max-w-3xl mx-auto leading-relaxed">
              Advanced AI-Powered Trading Signals with Real-Time Market Analysis
            </p>
            <div className="flex flex-wrap gap-6 justify-center text-sm">
              <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm px-6 py-3 rounded-full border border-border shadow-glow">
                <div className="w-3 h-3 rounded-full bg-bullish shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                <span className="text-foreground font-medium">Pattern Recognition</span>
              </div>
              <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm px-6 py-3 rounded-full border border-border shadow-glow">
                <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                <span className="text-foreground font-medium">Technical Indicators</span>
              </div>
              <div className="flex items-center gap-3 bg-card/50 backdrop-blur-sm px-6 py-3 rounded-full border border-border shadow-glow">
                <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_10px_rgba(6,182,212,0.5)]"></div>
                <span className="text-foreground font-medium">Confidence Scoring</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {user && activeTab === "home" && !analysisResult && (
          <div className="mb-8">
            <PerformanceBar />
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-6 mb-8">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden md:inline">Analyze</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <HistoryIcon className="h-4 w-4" />
              <span className="hidden md:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              <span className="hidden md:inline">News</span>
            </TabsTrigger>
            <TabsTrigger value="paper" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden md:inline">Paper</span>
            </TabsTrigger>
            <TabsTrigger value="backtest" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden md:inline">Backtest</span>
            </TabsTrigger>
            <TabsTrigger value="upgrade" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden md:inline">Premium</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-8">
            <div className="max-w-4xl mx-auto">
              {isAnalyzing ? (
                <LoadingAnalysis />
              ) : !analysisResult ? (
                <>
                  <RealTimeAnalysis 
                    onAnalysisComplete={(data) => {
                      setAnalysisResult(data);
                      setCurrentImageUrl(null);
                    }}
                    user={user}
                  />
                  <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-4 text-muted-foreground">Or upload a chart</span>
                    </div>
                  </div>
                  <UploadSection onImageSelected={handleImageSelected} isAnalyzing={isAnalyzing} />
                </>
              ) : (
                <>
                  <AnalysisResult analysis={analysisResult} imageUrl={currentImageUrl} />
                  <div className="flex justify-center mt-8">
                    <Button
                      onClick={() => {
                        setAnalysisResult(null);
                        setCurrentImageUrl(null);
                      }}
                      variant="outline"
                      size="lg"
                    >
                      Analyze Another Chart
                    </Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="max-w-4xl mx-auto">
              <HistoryTab />
            </div>
          </TabsContent>

          <TabsContent value="news">
            <div className="max-w-4xl mx-auto">
              <NewsTab />
            </div>
          </TabsContent>

          <TabsContent value="paper">
            <div className="max-w-4xl mx-auto">
              {user ? (
                <PaperTradingTab />
              ) : (
                <div className="max-w-2xl mx-auto text-center py-12">
                  <DollarSign className="h-16 w-16 mx-auto mb-6 text-primary" />
                  <h2 className="text-3xl font-bold mb-4">Sign in to Use Paper Trading</h2>
                  <p className="text-muted-foreground mb-8">
                    Create an account to practice trading without risk
                  </p>
                  <Button size="lg" onClick={() => navigate("/auth")}>
                    Sign In / Sign Up
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="backtest">
            <div className="max-w-4xl mx-auto">
              {user ? (
                <BacktestingTab />
              ) : (
                <div className="max-w-2xl mx-auto text-center py-12">
                  <Activity className="h-16 w-16 mx-auto mb-6 text-primary" />
                  <h2 className="text-3xl font-bold mb-4">Sign in to Use Backtesting</h2>
                  <p className="text-muted-foreground mb-8">
                    Create an account to test signals against historical data
                  </p>
                  <Button size="lg" onClick={() => navigate("/auth")}>
                    Sign In / Sign Up
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upgrade">
            <div className="max-w-4xl mx-auto">
              {user ? (
                <PremiumTab />
              ) : (
                <div className="max-w-2xl mx-auto text-center py-12">
                  <Crown className="h-16 w-16 mx-auto mb-6 text-primary" />
                  <h2 className="text-3xl font-bold mb-4">Sign in to Access Premium</h2>
                  <p className="text-muted-foreground mb-8">
                    Create an account to unlock premium features with crypto payment
                  </p>
                  <Button size="lg" onClick={() => navigate("/auth")}>
                    Sign In / Sign Up
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;