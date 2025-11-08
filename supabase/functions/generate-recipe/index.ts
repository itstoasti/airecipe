// Supabase Edge Function: Generate Recipe
// This function calls OpenAI API server-side to keep API keys secure

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get request body
    const { query, servingSize = 4 } = await req.json()

    if (!query) {
      throw new Error('Query is required')
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Create the prompt
    const prompt = `You are a professional chef assistant and nutrition expert. A user wants recipe suggestions for: "${query}" that serves ${servingSize} people.

Please provide 4 diverse recipe suggestions. For each recipe, provide:
- Title: A descriptive, appetizing recipe name
- Ingredients: Complete list with PRECISE measurements (e.g., "2 medium carrots, cut into chunks", "1 1/2 tablespoons olive oil", "1/2 pound lean ground beef")
- Instructions: Detailed, step-by-step cooking instructions similar to professional recipe sites. Each step should:
  * Include specific temperatures, times, and techniques
  * Describe visual cues and textures (e.g., "until light golden and soft", "until most of the water is absorbed")
  * Provide helpful tips in parentheses when needed
  * Be comprehensive enough that a home cook can follow without confusion
- Estimated time: Total time from start to finish (e.g., "45 minutes")
- Serving size: MUST be exactly ${servingSize} servings (the number requested by the user)
- Calories per serving: EXTREMELY ACCURATE calorie count per serving. This is CRITICAL for health/diet tracking.
- Category: Choose the MOST APPROPRIATE category from: Breakfast, Lunch, Dinner, Snacks, Drinks, Desserts
  * Breakfast: Morning meals like pancakes, eggs, omelettes, french toast
  * Lunch: Midday meals like sandwiches, salads, soups, wraps
  * Dinner: Evening meals like roasts, steaks, pasta dishes, casseroles, pot pies (savory pies)
  * Snacks: Small bites like chips, dips, finger foods, appetizers
  * Drinks: Beverages like smoothies, juices, cocktails, coffee drinks
  * Desserts: Sweet treats like cakes, cookies, ice cream, fruit pies (sweet pies)

MANDATORY CALORIE CALCULATION PROCESS (you MUST calculate for EVERY SINGLE ingredient - NO EXCEPTIONS):
Step 1: For EACH AND EVERY ingredient listed (including seasonings, oils, butter, cheese, etc.), calculate exact calories:
  - Convert measurement to grams/ml
  - Use USDA FoodData Central values
  - Calculate: (ingredient amount in grams ÷ 100) × calories per 100g
  - VERIFY you counted every single item in the ingredients list

Step 2: Sum ALL ingredient calories (total recipe calories) - recount to ensure nothing was missed

Step 3: Divide by ${servingSize} servings

Step 4: DOUBLE-CHECK your math - recalculate to verify accuracy

Return ONLY a valid JSON array with no additional text:
[
  {
    "title": "Recipe Name",
    "ingredients": ["ingredient 1", "ingredient 2", ...],
    "instructions": ["step 1", "step 2", ...],
    "estimatedTime": "45 minutes",
    "servingSize": ${servingSize},
    "caloriesPerServing": 450,
    "category": "Dinner"
  }
]`

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful chef assistant. Always return valid JSON arrays.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 4000,
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const openaiData = await openaiResponse.json()
    const content = openaiData.choices[0]?.message?.content

    if (!content) {
      throw new Error('No content in OpenAI response')
    }

    // Parse JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Failed to parse recipe JSON')
    }

    const recipes = JSON.parse(jsonMatch[0])

    // Add unique IDs
    const recipesWithIds = recipes.map((recipe: any, index: number) => ({
      ...recipe,
      id: `recipe-${Date.now()}-${index}`,
    }))

    return new Response(
      JSON.stringify({ recipes: recipesWithIds }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
