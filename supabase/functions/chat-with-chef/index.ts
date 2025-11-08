// Supabase Edge Function: Chat with Chef
// This function enables recipe modification chat server-side

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
    const { recipe, messages, userMessage } = await req.json()

    if (!recipe || !userMessage) {
      throw new Error('Recipe and userMessage are required')
    }

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Build system prompt
    const systemPrompt = `You're a friendly professional chef helping with this recipe. Be warm, helpful, and concise.

Current recipe:
${recipe.title} | ${recipe.servingSize} servings | ${recipe.caloriesPerServing} cal/serving | ${recipe.estimatedTime}

Ingredients: ${recipe.ingredients.join(', ')}
Instructions: ${recipe.instructions.join(' ')}

Guidelines:
1. Keep responses brief and friendly (1-2 sentences max)
2. Give clear, helpful instructions
3. If modifying the recipe, return updated JSON:
{
  "response": "Your friendly message",
  "updatedRecipe": {
    "title": "Updated Title",
    "ingredients": ["updated", "list"],
    "instructions": ["updated", "steps"],
    "estimatedTime": "new time",
    "servingSize": number,
    "caloriesPerServing": number
  }
}
4. If just chatting (no modifications), return:
{
  "response": "Your friendly message"
}

User requests (ALWAYS provide updated recipe JSON):
- "double the recipe" → multiply ingredients & serving size by 2
- "make it vegan" → substitute animal products
- "add more spice" → add chili/spices to ingredients
- "reduce calories" → suggest lighter alternatives
- Questions → answer helpfully without modifying recipe`

    // Build conversation history
    const conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ]

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 2000,
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

    // Try to parse JSON response
    let result
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        // Plain text response
        result = {
          response: content,
          updatedRecipe: recipe, // No changes
        }
      }
    } catch {
      // If JSON parsing fails, treat as plain text
      result = {
        response: content,
        updatedRecipe: recipe,
      }
    }

    // Ensure we always return both response and updatedRecipe
    if (!result.updatedRecipe) {
      result.updatedRecipe = recipe
    }

    return new Response(
      JSON.stringify(result),
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
