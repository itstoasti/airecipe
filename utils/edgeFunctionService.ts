// Service to call Supabase Edge Functions
// API keys are kept secure server-side

import { Recipe, Message } from '../types';

const SUPABASE_URL = 'https://hlyrnwalexksdzibduhm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhseXJud2FsZXhrc2R6aWJkdWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDA2MTMsImV4cCI6MjA3NjY3NjYxM30.08rdtd5lFjPeKlAQO1tc67iSpWNQ-CWZc6_bZ_rTIPY';

/**
 * Call Supabase Edge Function
 */
const callEdgeFunction = async (
  functionName: string,
  body: any,
  accessToken: string
): Promise<any> => {
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/${functionName}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error(`Edge Function error (${functionName}):`, error);
    throw new Error(`Failed to call ${functionName}: ${response.status}`);
  }

  return await response.json();
};

/**
 * Generate recipe suggestions using Edge Function
 * This keeps OpenAI API key secure on the server
 */
export const getRecipeSuggestions = async (
  query: string,
  servingSize: number,
  accessToken: string
): Promise<Recipe[]> => {
  try {
    console.log('Calling generate-recipe Edge Function...');

    const data = await callEdgeFunction(
      'generate-recipe',
      { query, servingSize },
      accessToken
    );

    if (!data.recipes || !Array.isArray(data.recipes)) {
      throw new Error('Invalid response from generate-recipe function');
    }

    // Generate images for each recipe in parallel
    console.log('Generating images for recipes...');
    const recipesWithImages = await Promise.all(
      data.recipes.map(async (recipe: Recipe) => {
        try {
          const { imageUrl } = await callEdgeFunction(
            'generate-image',
            {
              recipeTitle: recipe.title,
              ingredients: recipe.ingredients,
            },
            accessToken
          );
          return { ...recipe, imageUrl };
        } catch (error) {
          console.error(`Failed to generate image for ${recipe.title}:`, error);
          return recipe; // Return recipe without image if generation fails
        }
      })
    );

    return recipesWithImages;
  } catch (error) {
    console.error('Error getting recipe suggestions:', error);
    throw error;
  }
};

/**
 * Generate recipe image using Edge Function
 * This keeps FAL API key secure on the server
 */
export const generateRecipeImage = async (
  recipeTitle: string,
  ingredients: string[],
  accessToken: string
): Promise<string | null> => {
  try {
    const data = await callEdgeFunction(
      'generate-image',
      { recipeTitle, ingredients },
      accessToken
    );

    return data.imageUrl || null;
  } catch (error) {
    console.error('Error generating recipe image:', error);
    return null;
  }
};

/**
 * Chat with chef to modify recipe using Edge Function
 * This keeps OpenAI API key secure on the server
 */
export const chatWithChef = async (
  recipe: Recipe,
  messages: Message[],
  userMessage: string,
  accessToken: string
): Promise<{ response: string; updatedRecipe: Recipe }> => {
  try {
    const data = await callEdgeFunction(
      'chat-with-chef',
      { recipe, messages, userMessage },
      accessToken
    );

    if (!data.response) {
      throw new Error('Invalid response from chat-with-chef function');
    }

    return {
      response: data.response,
      updatedRecipe: data.updatedRecipe || recipe,
    };
  } catch (error) {
    console.error('Error chatting with chef:', error);
    throw error;
  }
};
