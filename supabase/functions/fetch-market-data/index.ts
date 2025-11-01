import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BybitKlineData {
  symbol: string;
  interval: string;
  openTime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  turnover: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = 'BTCUSDT', interval = '15', limit = 100 } = await req.json();
    
    // Input validation
    const ALLOWED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'BNBUSDT', 'ADAUSDT', 'DOGEUSDT', 'MATICUSDT'];
    const ALLOWED_INTERVALS = ['1', '5', '15', '30', '60', '240', 'D'];
    
    if (!ALLOWED_SYMBOLS.includes(symbol)) {
      return new Response(JSON.stringify({ error: 'Invalid symbol' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!ALLOWED_INTERVALS.includes(interval)) {
      return new Response(JSON.stringify({ error: 'Invalid interval' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 500) {
      return new Response(JSON.stringify({ error: 'Limit must be 1-500' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    console.log('Fetching market data for:', { symbol, interval, limit: parsedLimit });

    // Fetch candlestick data from Bybit
    const klineUrl = `https://api.bybit.com/v5/market/kline?category=spot&symbol=${symbol}&interval=${interval}&limit=${limit}`;
    const klineResponse = await fetch(klineUrl);
    
    if (!klineResponse.ok) {
      throw new Error(`Bybit API error: ${klineResponse.status}`);
    }

    const klineData = await klineResponse.json();
    
    if (klineData.retCode !== 0) {
      throw new Error(`Bybit API error: ${klineData.retMsg}`);
    }

    // Fetch ticker data for current price
    const tickerUrl = `https://api.bybit.com/v5/market/tickers?category=spot&symbol=${symbol}`;
    const tickerResponse = await fetch(tickerUrl);
    const tickerData = await tickerResponse.json();

    // Calculate technical indicators
    const candles = klineData.result.list.reverse(); // Bybit returns newest first
    const closes = candles.map((c: any) => parseFloat(c[4]));
    const highs = candles.map((c: any) => parseFloat(c[2]));
    const lows = candles.map((c: any) => parseFloat(c[3]));
    const volumes = candles.map((c: any) => parseFloat(c[5]));

    // Calculate EMA (20 and 50)
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);

    // Calculate RSI (14)
    const rsi = calculateRSI(closes, 14);

    // Calculate MACD
    const macd = calculateMACD(closes);

    // Calculate Bollinger Bands (20, 2)
    const bb = calculateBollingerBands(closes, 20, 2);

    // Calculate VWAP
    const vwap = calculateVWAP(highs, lows, closes, volumes);

    const currentPrice = parseFloat(tickerData.result.list[0].lastPrice);
    const priceChange24h = parseFloat(tickerData.result.list[0].price24hPcnt) * 100;

    const response = {
      symbol,
      interval,
      currentPrice,
      priceChange24h,
      candles: candles.slice(-50).map((c: any) => ({
        time: parseInt(c[0]),
        open: parseFloat(c[1]),
        high: parseFloat(c[2]),
        low: parseFloat(c[3]),
        close: parseFloat(c[4]),
        volume: parseFloat(c[5]),
      })),
      indicators: {
        ema20: ema20[ema20.length - 1],
        ema50: ema50[ema50.length - 1],
        rsi: rsi[rsi.length - 1],
        macd: {
          macd: macd.macd[macd.macd.length - 1],
          signal: macd.signal[macd.signal.length - 1],
          histogram: macd.histogram[macd.histogram.length - 1],
        },
        bollingerBands: {
          upper: bb.upper[bb.upper.length - 1],
          middle: bb.middle[bb.middle.length - 1],
          lower: bb.lower[bb.lower.length - 1],
        },
        vwap: vwap[vwap.length - 1],
      },
      volume24h: parseFloat(tickerData.result.list[0].volume24h),
    };

    console.log('Market data fetched successfully:', response.symbol);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in fetch-market-data function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Technical indicator calculation functions
function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema.push(sum / period);
  
  // Calculate EMA
  for (let i = period; i < data.length; i++) {
    ema.push((data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]);
  }
  
  return ema;
}

function calculateRSI(data: number[], period: number): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  for (let i = period - 1; i < gains.length; i++) {
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
}

function calculateMACD(data: number[]): { macd: number[], signal: number[], histogram: number[] } {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  
  const macd: number[] = [];
  const startIndex = 26 - 12;
  
  for (let i = 0; i < ema12.length - startIndex; i++) {
    macd.push(ema12[i + startIndex] - ema26[i]);
  }
  
  const signal = calculateEMA(macd, 9);
  const histogram: number[] = [];
  
  for (let i = 0; i < signal.length; i++) {
    histogram.push(macd[i + (macd.length - signal.length)] - signal[i]);
  }
  
  return { macd, signal, histogram };
}

function calculateBollingerBands(data: number[], period: number, stdDev: number) {
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];
  
  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sma = slice.reduce((a, b) => a + b) / period;
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
    const sd = Math.sqrt(variance);
    
    middle.push(sma);
    upper.push(sma + (stdDev * sd));
    lower.push(sma - (stdDev * sd));
  }
  
  return { upper, middle, lower };
}

function calculateVWAP(highs: number[], lows: number[], closes: number[], volumes: number[]): number[] {
  const vwap: number[] = [];
  let cumulativePV = 0;
  let cumulativeVolume = 0;
  
  for (let i = 0; i < closes.length; i++) {
    const typicalPrice = (highs[i] + lows[i] + closes[i]) / 3;
    cumulativePV += typicalPrice * volumes[i];
    cumulativeVolume += volumes[i];
    vwap.push(cumulativePV / cumulativeVolume);
  }
  
  return vwap;
}
