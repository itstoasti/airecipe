import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Recipe, Message } from '../types';

const API_KEY_STORAGE = 'openai_api_key';
const FAL_API_KEY_STORAGE = 'fal_api_key';
const RECIPES_STORAGE = 'saved_recipes';
const CHAT_MESSAGES_STORAGE = 'chat_messages';

// OpenAI API Key Management
export const saveApiKey = async (apiKey: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(API_KEY_STORAGE, apiKey);
  } catch (error) {
    console.error('Error saving API key:', error);
    throw error;
  }
};

export const getApiKey = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(API_KEY_STORAGE);
  } catch (error) {
    console.error('Error getting API key:', error);
    return null;
  }
};

export const deleteApiKey = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(API_KEY_STORAGE);
  } catch (error) {
    console.error('Error deleting API key:', error);
    throw error;
  }
};

// FAL API Key Management
export const saveFalApiKey = async (apiKey: string): Promise<void> => {
  try {
    await SecureStore.setItemAsync(FAL_API_KEY_STORAGE, apiKey);
  } catch (error) {
    console.error('Error saving FAL API key:', error);
    throw error;
  }
};

export const getFalApiKey = async (): Promise<string | null> => {
  try {
    return await SecureStore.getItemAsync(FAL_API_KEY_STORAGE);
  } catch (error) {
    console.error('Error getting FAL API key:', error);
    return null;
  }
};

export const deleteFalApiKey = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(FAL_API_KEY_STORAGE);
  } catch (error) {
    console.error('Error deleting FAL API key:', error);
    throw error;
  }
};

// Recipe Management
export const saveRecipe = async (recipe: Recipe, isPro: boolean = false): Promise<void> => {
  try {
    const existingRecipes = await getSavedRecipes();

    // Check if recipe already exists (update instead of add)
    const existingIndex = existingRecipes.findIndex(r => r.id === recipe.id);
    if (existingIndex !== -1) {
      // Update existing recipe
      existingRecipes[existingIndex] = recipe;
      await AsyncStorage.setItem(RECIPES_STORAGE, JSON.stringify(existingRecipes));
      return;
    }

    // Check free tier limit (10 recipes max)
    if (!isPro && existingRecipes.length >= 10) {
      throw new Error('Free tier limit reached. You can save up to 10 recipes. Upgrade to Pro for unlimited storage or delete some recipes.');
    }

    const updatedRecipes = [...existingRecipes, recipe];
    await AsyncStorage.setItem(RECIPES_STORAGE, JSON.stringify(updatedRecipes));
  } catch (error) {
    console.error('Error saving recipe:', error);
    throw error;
  }
};

export const getSavedRecipes = async (): Promise<Recipe[]> => {
  try {
    const recipesJson = await AsyncStorage.getItem(RECIPES_STORAGE);
    return recipesJson ? JSON.parse(recipesJson) : [];
  } catch (error) {
    console.error('Error getting saved recipes:', error);
    return [];
  }
};

export const deleteRecipe = async (recipeId: string): Promise<void> => {
  try {
    const existingRecipes = await getSavedRecipes();
    const updatedRecipes = existingRecipes.filter(r => r.id !== recipeId);
    await AsyncStorage.setItem(RECIPES_STORAGE, JSON.stringify(updatedRecipes));
  } catch (error) {
    console.error('Error deleting recipe:', error);
    throw error;
  }
};

export const getRecipesByCategory = async (category: string): Promise<Recipe[]> => {
  try {
    const allRecipes = await getSavedRecipes();
    return allRecipes.filter(r => r.category === category);
  } catch (error) {
    console.error('Error getting recipes by category:', error);
    return [];
  }
};

export const updateRecipe = async (updatedRecipe: Recipe): Promise<void> => {
  try {
    const existingRecipes = await getSavedRecipes();
    const recipeIndex = existingRecipes.findIndex(r => r.id === updatedRecipe.id);

    if (recipeIndex !== -1) {
      existingRecipes[recipeIndex] = updatedRecipe;
      await AsyncStorage.setItem(RECIPES_STORAGE, JSON.stringify(existingRecipes));
    }
  } catch (error) {
    console.error('Error updating recipe:', error);
    throw error;
  }
};

export const getSavedRecipesCount = async (): Promise<number> => {
  try {
    const recipes = await getSavedRecipes();
    return recipes.length;
  } catch (error) {
    console.error('Error getting saved recipes count:', error);
    return 0;
  }
};

export const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Desserts', 'Snacks', 'Drinks'];

// Chat Messages Management
export const saveChatMessages = async (recipeId: string, messages: Message[]): Promise<void> => {
  try {
    const allChats = await getAllChatMessages();
    allChats[recipeId] = messages;
    await AsyncStorage.setItem(CHAT_MESSAGES_STORAGE, JSON.stringify(allChats));
  } catch (error) {
    console.error('Error saving chat messages:', error);
    throw error;
  }
};

export const getChatMessages = async (recipeId: string): Promise<Message[]> => {
  try {
    const allChats = await getAllChatMessages();
    return allChats[recipeId] || [];
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return [];
  }
};

export const getAllChatMessages = async (): Promise<{ [recipeId: string]: Message[] }> => {
  try {
    const chatsJson = await AsyncStorage.getItem(CHAT_MESSAGES_STORAGE);
    return chatsJson ? JSON.parse(chatsJson) : {};
  } catch (error) {
    console.error('Error getting all chat messages:', error);
    return {};
  }
};

export const deleteChatMessages = async (recipeId: string): Promise<void> => {
  try {
    const allChats = await getAllChatMessages();
    delete allChats[recipeId];
    await AsyncStorage.setItem(CHAT_MESSAGES_STORAGE, JSON.stringify(allChats));
  } catch (error) {
    console.error('Error deleting chat messages:', error);
    throw error;
  }
};
