// Usage tracking for free tier limits
import AsyncStorage from '@react-native-async-storage/async-storage';

const USAGE_KEY = 'recipe_usage_tracking';

export interface UsageStats {
  recipesGeneratedToday: number;
  lastGenerationDate: string; // ISO date string
  totalRecipesGenerated: number;
}

// Free tier limits
export const FREE_TIER_LIMITS = {
  DAILY_RECIPE_GENERATIONS: 3,
  MAX_SAVED_RECIPES: 10,
};

export const PRO_TIER_LIMITS = {
  DAILY_RECIPE_GENERATIONS: -1, // Unlimited
  MAX_SAVED_RECIPES: -1, // Unlimited
};

/**
 * Get current usage stats
 */
export const getUsageStats = async (): Promise<UsageStats> => {
  try {
    const data = await AsyncStorage.getItem(USAGE_KEY);
    if (data) {
      const stats: UsageStats = JSON.parse(data);

      // Reset daily count if it's a new day
      const today = new Date().toISOString().split('T')[0];
      if (stats.lastGenerationDate !== today) {
        stats.recipesGeneratedToday = 0;
        stats.lastGenerationDate = today;
        await saveUsageStats(stats);
      }

      return stats;
    }

    // Return default stats if none exist
    const defaultStats: UsageStats = {
      recipesGeneratedToday: 0,
      lastGenerationDate: new Date().toISOString().split('T')[0],
      totalRecipesGenerated: 0,
    };
    await saveUsageStats(defaultStats);
    return defaultStats;
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return {
      recipesGeneratedToday: 0,
      lastGenerationDate: new Date().toISOString().split('T')[0],
      totalRecipesGenerated: 0,
    };
  }
};

/**
 * Save usage stats
 */
const saveUsageStats = async (stats: UsageStats): Promise<void> => {
  try {
    await AsyncStorage.setItem(USAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving usage stats:', error);
  }
};

/**
 * Increment recipe generation count
 */
export const incrementRecipeGeneration = async (): Promise<void> => {
  try {
    const stats = await getUsageStats();
    stats.recipesGeneratedToday += 1;
    stats.totalRecipesGenerated += 1;
    await saveUsageStats(stats);
  } catch (error) {
    console.error('Error incrementing recipe generation:', error);
  }
};

/**
 * Check if user can generate more recipes (for free tier)
 */
export const canGenerateRecipe = async (isPro: boolean): Promise<boolean> => {
  if (isPro) {
    return true; // Pro users have unlimited generations
  }

  const stats = await getUsageStats();
  return stats.recipesGeneratedToday < FREE_TIER_LIMITS.DAILY_RECIPE_GENERATIONS;
};

/**
 * Get remaining recipe generations for today
 */
export const getRemainingGenerations = async (isPro: boolean): Promise<number> => {
  if (isPro) {
    return -1; // Unlimited
  }

  const stats = await getUsageStats();
  const remaining = FREE_TIER_LIMITS.DAILY_RECIPE_GENERATIONS - stats.recipesGeneratedToday;
  return Math.max(0, remaining);
};

/**
 * Reset usage stats (useful for testing)
 */
export const resetUsageStats = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USAGE_KEY);
  } catch (error) {
    console.error('Error resetting usage stats:', error);
  }
};
