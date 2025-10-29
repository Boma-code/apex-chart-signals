import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h3 className="font-bold text-lg mb-1">Chart Signal Pro</h3>
            <p className="text-sm text-muted-foreground">
              AI-Powered Trading Signals
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-bearish fill-bearish" />
            <span>for traders worldwide</span>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Chart Signal Pro
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Not financial advice. Trade responsibly.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
