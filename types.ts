export interface Recipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  estimatedTime: string;
  servingSize: number;
  caloriesPerServing: number;
  category?: string;
  imageUrl?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export type RootStackParamList = {
  ApiKeySetup: undefined;
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  MainTabs: undefined;
  ChatToModify: { recipe: Recipe };
  ShoppingList: { recipe: Recipe };
  PopularRecipes: undefined;
  AddRecipe: undefined;
  MealPlanning: undefined;
  Profile: undefined;
  Paywall: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Recipes: undefined;
  SavedRecipes: undefined;
};
