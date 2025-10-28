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
    const { imageUrl, assetType } = await req.json();
    console.log('Analyzing chart:', { assetType });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // System prompt for trading analysis
    const systemPrompt = `You are an expert trading analyst specializing in technical analysis for ${assetType} markets. Analyze the provided chart image and provide a comprehensive trading signal analysis.

Your analysis must include:
1. Signal: Determine if this is a BUY, SELL, or HOLD opportunity
2. Confidence: Rate your confidence from 0-100%
3. Entry Price: Suggested entry price level
4. Stop Loss: Recommended stop loss level
5. Take Profit: Target profit level
6. Market Condition: Classify as "Bullish", "Bearish", or "Ranging"
7. Pattern Details: Identify chart patterns (e.g., "Double Top", "Head & Shoulders", "Triangle")
8. Indicators Analysis: Analyze visible indicators (RSI, MACD, EMA trends, volume)
9. AI Commentary: Detailed explanation of your analysis and reasoning

Format your response as JSON with this structure:
{
  "signal": "BUY|SELL|HOLD",
  "confidence": 85,
  "entry_price": 1.2345,
  "stop_loss": 1.2200,
  "take_profit": 1.2600,
  "market_condition": "Bullish|Bearish|Ranging",
  "pattern_details": "Description of patterns",
  "indicators_analysis": "Analysis of indicators",
  "ai_commentary": "Detailed reasoning"
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
          { 
            role: 'user', 
            content: [
              { type: 'text', text: 'Analyze this trading chart and provide a comprehensive signal analysis.' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
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

    // Parse the JSON response from AI
    let analysisData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback with default structure
      analysisData = {
        signal: 'HOLD',
        confidence: 50,
        entry_price: null,
        stop_loss: null,
        take_profit: null,
        market_condition: 'Ranging',
        pattern_details: 'Unable to determine patterns',
        indicators_analysis: 'Chart analysis unavailable',
        ai_commentary: aiResponse || 'Analysis could not be completed.'
      };
    }

    return new Response(
      JSON.stringify(analysisData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-chart function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});