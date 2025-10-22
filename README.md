# AI Recipe App

A React Native mobile application built with Expo SDK 54 that provides AI-powered recipe suggestions and management using OpenAI's API.

## Features

- **AI Recipe Suggestions**: Get personalized recipe recommendations based on your input
- **Chat with Chef**: Modify recipes in real-time using AI chat interface
- **Recipe Management**: Save recipes to categories (Breakfast, Lunch, Dinner, Desserts, Snacks)
- **Shopping Lists**: Generate and manage shopping lists from recipe ingredients
- **Secure API Key Storage**: Your OpenAI API key is stored securely on your device

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- OpenAI API key (get one at https://platform.openai.com)

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd "AI Recipe"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

4. **Run on your device**:
   - Install the Expo Go app on your iOS or Android device
   - Scan the QR code from the terminal
   - OR press `i` for iOS simulator or `a` for Android emulator

## First Time Setup

1. When you first launch the app, you'll be prompted to enter your OpenAI API key
2. Get your API key from https://platform.openai.com:
   - Sign up or log in
   - Navigate to API Keys section
   - Create a new secret key
3. Enter the API key (format: `sk-...`)
4. The key is stored securely using Expo SecureStore and never leaves your device

## Usage

### Home Screen
- Enter what you want to eat (e.g., "pasta", "vegan dinner", "quick breakfast")
- Tap the search button to get AI-generated recipe suggestions
- Each recipe shows title, ingredients, instructions, and estimated time
- **Save**: Add recipe to a category for later
- **Chat to Modify**: Open AI chat to modify the recipe

### Saved Recipes
- Browse saved recipes by category
- View full recipe details
- Generate shopping lists
- Delete recipes you no longer need

### Chat to Modify
- Ask the AI chef to modify recipes (e.g., "Make it vegan", "Reduce calories", "Add more spice")
- View the updated recipe in real-time
- Save modified versions

### Shopping List
- Auto-generated from recipe ingredients
- Check off items as you shop
- Track progress with visual progress bar
- Share the list via any app

## Project Structure

```
AI Recipe/
├── App.tsx                      # Main app component with navigation
├── types.ts                     # TypeScript type definitions
├── package.json                 # Dependencies
├── app.json                     # Expo configuration
├── babel.config.js              # Babel configuration
├── screens/
│   ├── ApiKeySetupScreen.tsx   # Initial API key setup
│   ├── HomeScreen.tsx          # Recipe search and suggestions
│   ├── SavedRecipesScreen.tsx  # Saved recipes by category
│   ├── ChatToModifyScreen.tsx  # AI chat interface
│   └── ShoppingListScreen.tsx  # Shopping list management
└── utils/
    ├── storage.ts              # AsyncStorage & SecureStore utilities
    └── openaiService.ts        # OpenAI API integration
```

## Technologies Used

- **Expo SDK 54**: React Native framework
- **React Navigation**: Navigation library (Stack & Tab navigators)
- **OpenAI API**: GPT-4 for recipe generation and chat
- **AsyncStorage**: Recipe data persistence
- **Expo SecureStore**: Secure API key storage
- **TypeScript**: Type-safe development

## API Usage & Costs

This app uses OpenAI's API which requires payment. Estimated costs:
- Recipe suggestions: ~$0.01-0.03 per search (4 recipes)
- Chat modifications: ~$0.005-0.015 per message

Monitor your usage at https://platform.openai.com/usage

## Troubleshooting

### "API key not found" error
- Go to Settings and re-enter your API key
- Verify the key format starts with `sk-`

### No recipe suggestions appearing
- Check your internet connection
- Verify your OpenAI API key has credits
- Check for error messages

### App won't start
- Clear Expo cache: `npx expo start -c`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

## Future Enhancements

- Recipe ratings and reviews
- Meal planning calendar
- Nutrition information
- Recipe sharing with friends
- Photo upload for recipe matching
- Voice input for hands-free cooking

## License

MIT License - feel free to use this project for learning and development.

## Support

For issues or questions:
- Check the Expo documentation: https://docs.expo.dev
- OpenAI API docs: https://platform.openai.com/docs

## Privacy

- Your OpenAI API key is stored securely on your device only
- No data is sent to any servers except OpenAI's API
- All recipe data is stored locally on your device
