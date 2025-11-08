// Supabase Edge Function: Generate Recipe Image
// This function calls FAL.ai API server-side to keep API keys secure

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
    const { recipeTitle, ingredients } = await req.json()

    if (!recipeTitle) {
      throw new Error('Recipe title is required')
    }

    // Get FAL API key from environment
    const falApiKey = Deno.env.get('FAL_API_KEY')
    if (!falApiKey) {
      console.warn('FAL API key not configured')
      return new Response(
        JSON.stringify({ imageUrl: null }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Create a descriptive prompt for the recipe
    const mainIngredients = ingredients?.slice(0, 3).join(', ') || ''
    const prompt = `A beautiful, appetizing photo of ${recipeTitle}. The dish features ${mainIngredients}. Professional food photography, well-lit, restaurant quality presentation, high resolution, delicious looking.`

    console.log('Generating image with prompt:', prompt)

    // Call FAL API
    const falResponse = await fetch('https://fal.run/fal-ai/nano-banana', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        num_images: 1,
        output_format: 'jpeg',
        image_size: 'square',
      }),
    })

    if (!falResponse.ok) {
      const errorText = await falResponse.text()
      console.error('FAL API error:', falResponse.status, errorText)
      throw new Error(`FAL API error: ${falResponse.status}`)
    }

    const data = await falResponse.json()
    console.log('FAL API response:', data)

    // Extract the image URL from the response
    let imageUrl = null
    if (data.images && data.images.length > 0) {
      imageUrl = data.images[0].url
      console.log('Image generated successfully:', imageUrl)
    } else {
      console.warn('No image URL in response')
    }

    return new Response(
      JSON.stringify({ imageUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message, imageUrl: null }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 with null imageUrl so app continues without image
      }
    )
  }
})
