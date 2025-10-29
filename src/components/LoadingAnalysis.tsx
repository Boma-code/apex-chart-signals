import { Activity } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function LoadingAnalysis() {
  return (
    <Card className="p-8 bg-card shadow-card border-border">
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="relative">
          <Activity className="h-16 w-16 text-primary animate-pulse" />
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold">Analyzing Chart...</h3>
          <p className="text-muted-foreground">
            AI is processing your trading chart
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-bullish animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        
        <div className="text-sm text-muted-foreground space-y-1 text-center">
          <p className="opacity-80">• Detecting chart patterns</p>
          <p className="opacity-60">• Analyzing technical indicators</p>
          <p className="opacity-40">• Calculating signal confidence</p>
        </div>
      </div>
    </Card>
  );
}
