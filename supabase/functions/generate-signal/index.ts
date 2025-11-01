import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { marketData, assetType } = await req.json();
    
    // Input validation
    if (!marketData || typeof marketData !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid market data' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!assetType || typeof assetType !== 'string' || assetType.length > 50) {
      return new Response(JSON.stringify({ error: 'Invalid asset type' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    console.log('Generating signal for:', { symbol: marketData.symbol, assetType });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert algorithmic trading analyst specializing in ${assetType} markets. Analyze the provided real-time market data and technical indicators to generate a comprehensive trading signal.

Market Data Provided:
- Current Price: ${marketData.currentPrice}
- 24h Change: ${marketData.priceChange24h}%
- Technical Indicators:
  * EMA 20: ${marketData.indicators.ema20}
  * EMA 50: ${marketData.indicators.ema50}
  * RSI (14): ${marketData.indicators.rsi}
  * MACD: ${marketData.indicators.macd.macd}
  * MACD Signal: ${marketData.indicators.macd.signal}
  * MACD Histogram: ${marketData.indicators.macd.histogram}
  * Bollinger Upper: ${marketData.indicators.bollingerBands.upper}
  * Bollinger Middle: ${marketData.indicators.bollingerBands.middle}
  * Bollinger Lower: ${marketData.indicators.bollingerBands.lower}
  * VWAP: ${marketData.indicators.vwap}

Analyze these indicators and provide:
1. Signal: BUY, SELL, or HOLD
2. Confidence: 0-100% based on indicator alignment
3. Entry Price: Optimal entry level
4. Stop Loss: Risk management level
5. Take Profit: Target profit level (use realistic 2-5% moves)
6. Market Condition: Bullish, Bearish, or Ranging
7. Pattern Details: Key technical patterns detected
8. Indicators Analysis: Detailed analysis of each indicator
9. AI Commentary: Professional reasoning for the signal

Consider:
- EMA crossovers (bullish if EMA20 > EMA50, bearish if opposite)
- RSI levels (oversold <30, overbought >70, neutral 30-70)
- MACD signals (bullish if MACD > signal, bearish if opposite)
- Bollinger Bands (price near upper = overbought, near lower = oversold)
- VWAP (price above = bullish, below = bearish)

Format response as JSON:
{
  "signal": "BUY|SELL|HOLD",
  "confidence": 85,
  "entry_price": 43250.50,
  "stop_loss": 42800.00,
  "take_profit": 44100.00,
  "market_condition": "Bullish|Bearish|Ranging",
  "pattern_details": "Description",
  "indicators_analysis": "Detailed analysis",
  "ai_commentary": "Professional reasoning"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Analyze the current market data and generate a trading signal with detailed technical analysis.' }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    console.log('AI Response:', aiResponse);

    let analysisData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      analysisData = {
        signal: 'HOLD',
        confidence: 50,
        entry_price: marketData.currentPrice,
        stop_loss: marketData.currentPrice * 0.98,
        take_profit: marketData.currentPrice * 1.02,
        market_condition: 'Ranging',
        pattern_details: 'Unable to determine patterns',
        indicators_analysis: 'Analysis unavailable',
        ai_commentary: aiResponse || 'Analysis could not be completed.'
      };
    }

    // Add market data to response
    analysisData.marketData = {
      symbol: marketData.symbol,
      currentPrice: marketData.currentPrice,
      priceChange24h: marketData.priceChange24h,
      indicators: marketData.indicators,
    };

    return new Response(
      JSON.stringify(analysisData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-signal function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
