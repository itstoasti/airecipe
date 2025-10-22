import { supabaseFetch, DatabaseRecipe } from './supabaseClient';
import { Recipe } from '../types';

/**
 * Save a recipe to the Supabase database
 */
export const saveRecipeToDatabase = async (recipe: Recipe): Promise<void> => {
  try {
    await supabaseFetch('recipes', 'POST', {
      id: recipe.id,
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      estimated_time: recipe.estimatedTime,
      serving_size: recipe.servingSize,
      calories_per_serving: recipe.caloriesPerServing,
      view_count: 0,
      is_popular: false,
    });
  } catch (error) {
    // Silently fail - don't block the user experience
    console.log('Note: Recipe not saved to database (this is optional)');
  }
};

/**
 * Get popular recipes from the database
 */
export const getPopularRecipes = async (limit: number = 4): Promise<Recipe[]> => {
  try {
    const data = await supabaseFetch(
      `recipes?select=*&order=view_count.desc&limit=${limit}`,
      'GET'
    );

    if (!data || data.length === 0) {
      return [];
    }

    // Convert database format to app format
    return data.map((dbRecipe: DatabaseRecipe) => ({
      id: dbRecipe.id,
      title: dbRecipe.title,
      ingredients: dbRecipe.ingredients,
      instructions: dbRecipe.instructions,
      estimatedTime: dbRecipe.estimated_time,
      servingSize: dbRecipe.serving_size,
      caloriesPerServing: dbRecipe.calories_per_serving,
    }));
  } catch (error) {
    console.error('Error fetching popular recipes:', error);
    return [];
  }
};

/**
 * Increment view count for a recipe
 */
export const incrementRecipeViewCount = async (recipeId: string): Promise<void> => {
  try {
    // First get the current recipe
    const recipes = await supabaseFetch(
      `recipes?select=view_count&id=eq.${recipeId}`,
      'GET'
    );

    if (recipes && recipes.length > 0) {
      const currentCount = recipes[0].view_count || 0;

      // Update with incremented count
      await supabaseFetch(
        `recipes?id=eq.${recipeId}`,
        'PATCH',
        { view_count: currentCount + 1 }
      );
    }
  } catch (error) {
    console.log('Note: View count not updated');
  }
};
