import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Newspaper, Search, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  category: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
}

const NewsTab = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    filterNews();
  }, [news, searchQuery, categoryFilter, sentimentFilter]);

  const fetchNews = async () => {
    try {
      // Mock news data - In production, integrate with real news API
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title: 'Bitcoin Breaks $50,000 Resistance Level',
          description: 'Bitcoin has successfully broken through the critical $50,000 resistance level with strong volume.',
          url: '#',
          publishedAt: new Date().toISOString(),
          source: 'CryptoNews',
          category: 'crypto',
          sentiment: 'bullish'
        },
        {
          id: '2',
          title: 'Federal Reserve Hints at Rate Cuts',
          description: 'The Federal Reserve suggests potential interest rate cuts in the coming months.',
          url: '#',
          publishedAt: new Date(Date.now() - 3600000).toISOString(),
          source: 'FinancialTimes',
          category: 'forex',
          sentiment: 'bullish'
        },
        {
          id: '3',
          title: 'S&P 500 Faces Selling Pressure',
          description: 'Major indices experience selling pressure amid inflation concerns.',
          url: '#',
          publishedAt: new Date(Date.now() - 7200000).toISOString(),
          source: 'Bloomberg',
          category: 'stocks',
          sentiment: 'bearish'
        }
      ];
      
      setNews(mockNews);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterNews = () => {
    let filtered = news;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (sentimentFilter !== 'all') {
      filtered = filtered.filter(item => item.sentiment === sentimentFilter);
    }

    setFilteredNews(filtered);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'bg-bullish/20 text-bullish';
      case 'bearish': return 'bg-bearish/20 text-bearish';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse bg-muted h-32 rounded-lg" />
      ))}
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">Market News</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search news..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="crypto">Crypto</SelectItem>
            <SelectItem value="forex">Forex</SelectItem>
            <SelectItem value="stocks">Stocks</SelectItem>
            <SelectItem value="commodities">Commodities</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Sentiment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sentiment</SelectItem>
            <SelectItem value="bullish">Bullish</SelectItem>
            <SelectItem value="bearish">Bearish</SelectItem>
            <SelectItem value="neutral">Neutral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredNews.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No news articles found matching your filters.
          </Card>
        ) : (
          filteredNews.map((item) => (
            <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold flex-1">{item.title}</h3>
                <Badge className={getSentimentColor(item.sentiment)}>
                  {item.sentiment}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-3">{item.description}</p>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{item.category}</Badge>
                  <span className="text-muted-foreground">{item.source}</span>
                </div>
                <span className="text-muted-foreground">
                  {new Date(item.publishedAt).toLocaleTimeString()}
                </span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NewsTab;
