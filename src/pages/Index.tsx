import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Crown, Home, History as HistoryIcon } from "lucide-react";
import { toast } from "sonner";
import UploadSection from "@/components/UploadSection";
import AnalysisResult from "@/components/AnalysisResult";
import HistoryTab from "@/components/HistoryTab";
import LoadingAnalysis from "@/components/LoadingAnalysis";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-trading.jpg";

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisData | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("home");

  const handleImageSelected = async (image: File, assetType: string) => {
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
            });

          if (dbError) {
            console.error('Database error:', dbError);
            // Don't throw, still show results even if saving fails
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
      {/* Hero Section */}
      {!analysisResult && activeTab === "home" && (
        <div className="relative overflow-hidden">
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
          
          <div className="relative container mx-auto px-4 py-20 text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
              Chart Signal Pro
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              AI-Powered Trading Signals with Precision Analysis
            </p>
            <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-bullish"></div>
                <span>Pattern Recognition</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span>Technical Indicators</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent"></div>
                <span>Confidence Scoring</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <HistoryIcon className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="upgrade" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Premium
            </TabsTrigger>
          </TabsList>

          <TabsContent value="home" className="space-y-8">
            <div className="max-w-4xl mx-auto">
              {isAnalyzing ? (
                <LoadingAnalysis />
              ) : !analysisResult ? (
                <UploadSection onImageSelected={handleImageSelected} isAnalyzing={isAnalyzing} />
              ) : (
                <>
                  <AnalysisResult analysis={analysisResult} imageUrl={currentImageUrl!} />
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

          <TabsContent value="upgrade">
            <div className="max-w-2xl mx-auto text-center py-12">
              <Crown className="h-16 w-16 mx-auto mb-6 text-primary" />
              <h2 className="text-3xl font-bold mb-4">Upgrade to Premium</h2>
              <p className="text-muted-foreground mb-8">
                Unlock advanced AI analysis, custom strategies, and real-time alerts
              </p>
              <div className="space-y-4 text-left max-w-md mx-auto mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-bullish"></div>
                  <span>Advanced pattern recognition</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-bullish"></div>
                  <span>Real-time market alerts</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-bullish"></div>
                  <span>Custom trading strategies</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-bullish"></div>
                  <span>Priority AI processing</span>
                </div>
              </div>
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold shadow-glow">
                Coming Soon
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;