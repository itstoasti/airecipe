export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  estimatedTime: string;
  servingSize: number;
  caloriesPerServing: number;
  category?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export type RootStackParamList = {
  ApiKeySetup: undefined;
  MainTabs: undefined;
  ChatToModify: { recipe: Recipe };
  ShoppingList: { recipe: Recipe };
  PopularRecipes: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  SavedRecipes: undefined;
};
