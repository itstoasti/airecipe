import { supabaseFetch, DatabaseRecipe } from './supabaseClient';
import { Recipe } from '../types';
import { autoCategorizeRecipe } from './recipeCategorization';

// Cache for randomized recipes to maintain consistent order across pagination
let randomizedRecipesCache: DatabaseRecipe[] | null = null;
let randomCacheKey: string | null = null;

/**
 * Save a recipe to the Supabase database
 */
export const saveRecipeToDatabase = async (recipe: Recipe): Promise<void> => {
  try {
    // Auto-categorize the recipe if it doesn't have a category
    const category = recipe.category || autoCategorizeRecipe(recipe);

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
      image_url: recipe.imageUrl || null,
      category: category,
    });
  } catch (error) {
    // Silently fail - don't block the user experience
    console.log('Note: Recipe not saved to database (this is optional)');
  }
};

/**
 * Get popular recipes from the database
 */
export const getPopularRecipes = async (limit: number = 4, offset: number = 0): Promise<Recipe[]> => {
  try {
    const data = await supabaseFetch(
      `recipes?select=*&order=view_count.desc&limit=${limit}&offset=${offset}`,
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
      imageUrl: dbRecipe.image_url,
      category: dbRecipe.category,
    }));
  } catch (error) {
    console.error('Error fetching popular recipes:', error);
    return [];
  }
};

/**
 * Get all recipes from the database with pagination, search, sorting, and category filtering
 */
export const getAllRecipes = async (
  page: number = 0,
  limit: number = 20,
  searchQuery?: string,
  sortBy: 'random' | 'newest' | 'popular' | 'alphabetical' = 'random',
  category?: string
): Promise<Recipe[]> => {
  try {
    let data;

    if (sortBy === 'random') {
      // For random sorting, we need to fetch all recipes and randomize client-side
      // Use cache to maintain consistent order across pagination
      const cacheKey = `random_${searchQuery || 'all'}_${category || 'all'}`;

      // If cache is invalid or doesn't match current search/category, refresh it
      if (!randomizedRecipesCache || randomCacheKey !== cacheKey) {
        let url = 'recipes?select=*';

        // Build query filters
        const filters: string[] = [];

        if (searchQuery && searchQuery.trim()) {
          const query = searchQuery.trim();
          filters.push(`or=(title.ilike.*${query}*,ingredients.cs.{${query}})`);
        }

        if (category && category.toLowerCase() !== 'all') {
          filters.push(`category=ilike.${category}`);
        }

        if (filters.length > 0) {
          url = `recipes?select=*&${filters.join('&')}`;
        }

        const fetchedData = await supabaseFetch(url, 'GET');

        if (!fetchedData || fetchedData.length === 0) {
          return [];
        }

        // Shuffle the array using Fisher-Yates algorithm
        randomizedRecipesCache = [...fetchedData];
        for (let i = randomizedRecipesCache.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [randomizedRecipesCache[i], randomizedRecipesCache[j]] = [randomizedRecipesCache[j], randomizedRecipesCache[i]];
        }
        randomCacheKey = cacheKey;
      }

      // Apply pagination to cached randomized data
      const start = page * limit;
      const end = start + limit;
      data = randomizedRecipesCache.slice(start, end);
    } else {
      // For other sort options, use normal pagination
      const offset = page * limit;
      let orderBy = 'created_at.desc';

      if (sortBy === 'popular') {
        orderBy = 'view_count.desc';
      } else if (sortBy === 'alphabetical') {
        orderBy = 'title.asc';
      }

      // Build query filters
      const filters: string[] = [];

      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.trim();
        filters.push(`or=(title.ilike.*${query}*,ingredients.cs.{${query}})`);
      }

      if (category && category.toLowerCase() !== 'all') {
        filters.push(`category=ilike.${category}`);
      }

      let url = `recipes?select=*&order=${orderBy}&limit=${limit}&offset=${offset}`;
      if (filters.length > 0) {
        url = `recipes?select=*&${filters.join('&')}&order=${orderBy}&limit=${limit}&offset=${offset}`;
      }

      data = await supabaseFetch(url, 'GET');

      if (!data || data.length === 0) {
        return [];
      }
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
      imageUrl: dbRecipe.image_url,
      category: dbRecipe.category,
    }));
  } catch (error) {
    console.error('Error fetching all recipes:', error);
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
