import OpenAI from 'openai';
import { Recipe, Message } from '../types';
import { getApiKey } from './storage';

let openaiClient: OpenAI | null = null;

export const initializeOpenAI = async (): Promise<OpenAI> => {
  const apiKey = await getApiKey();

  if (!apiKey) {
    throw new Error('API key not found. Please set up your OpenAI API key.');
  }

  openaiClient = new OpenAI({
    apiKey: apiKey,
  });

  return openaiClient;
};

export const getRecipeSuggestions = async (query: string, servingSize: number = 4): Promise<Recipe[]> => {
  try {
    const client = await initializeOpenAI();

    const prompt = `You are a professional chef assistant and nutrition expert. A user wants recipe suggestions for: "${query}" that serves ${servingSize} people.

Please provide 4 diverse recipe suggestions. For each recipe, provide:
- Title: A descriptive, appetizing recipe name
- Ingredients: Complete list with PRECISE measurements (e.g., "2 medium carrots, cut into chunks", "1 1/2 tablespoons olive oil", "1/2 pound lean ground beef")
- Instructions: Detailed, step-by-step cooking instructions similar to professional recipe sites. Each step should:
  * Include specific temperatures, times, and techniques
  * Describe visual cues and textures (e.g., "until light golden and soft", "until most of the water is absorbed")
  * Provide helpful tips in parentheses when needed
  * Be comprehensive enough that a home cook can follow without confusion
- Estimated time: Total time from start to finish (e.g., "45 minutes")
- Serving size: MUST be exactly ${servingSize} servings (the number requested by the user)
- Calories per serving: EXTREMELY ACCURATE calorie count per serving. This is CRITICAL for health/diet tracking.

MANDATORY CALORIE CALCULATION PROCESS (you MUST show your work mentally):
Step 1: For EACH ingredient, calculate exact calories:
  - Convert measurement to grams/ml
  - Use USDA FoodData Central values
  - Calculate: (ingredient amount in grams ÷ 100) × calories per 100g

Step 2: Sum ALL ingredient calories (total recipe calories)

Step 3: Divide by ${servingSize} servings

Step 4: Round to nearest 5 calories

EXAMPLE CALCULATION:
Recipe: Pasta with Marinara (4 servings)
Ingredients:
- 1 pound pasta (454g) → (454 ÷ 100) × 131 = 595 cal
- 2 cups marinara (480g) → (480 ÷ 100) × 70 = 336 cal
- 2 tbsp olive oil (28ml) → (28 ÷ 14) × 124 = 248 cal
- 1/4 cup parmesan (25g) → (25 ÷ 100) × 431 = 108 cal
TOTAL: 595 + 336 + 248 + 108 = 1,287 cal
Per serving: 1,287 ÷ 4 = 322 cal (round to 320 cal)

USDA CALORIE REFERENCE (per 100g unless noted):
- Olive oil: 884 cal/100ml (1 tbsp = 14ml = 124 cal)
- Butter: 717 cal (1 tbsp = 14g = 100 cal)
- Chicken breast (raw): 165 cal
- Chicken breast (cooked): 195 cal
- Ground beef 90% lean (raw): 176 cal
- Ground beef 90% lean (cooked): 250 cal
- Ground beef 80% lean (cooked): 273 cal
- Salmon (raw): 208 cal
- Shrimp (raw): 99 cal
- Eggs (1 large = 50g): 72 cal per egg
- Rice (cooked white): 130 cal
- Rice (uncooked): 365 cal
- Pasta (cooked): 131 cal
- Pasta (uncooked): 371 cal
- Bread (white/wheat): 265 cal
- Potatoes (raw): 77 cal
- Sweet potato: 86 cal
- Broccoli: 34 cal
- Carrots: 41 cal
- Onions: 40 cal
- Tomatoes (fresh): 18 cal
- Tomato sauce/marinara: 70 cal
- Bell peppers: 31 cal
- Garlic: 149 cal
- Cheese (cheddar): 402 cal
- Cheese (mozzarella): 280 cal
- Cheese (parmesan): 431 cal
- Milk (whole): 61 cal/100ml
- Heavy cream: 340 cal/100ml
- Sugar (white): 387 cal (1 tsp = 4g = 16 cal)
- Honey: 304 cal
- Flour (all-purpose): 364 cal
- Beans (cooked): 127 cal
- Avocado: 160 cal
- Nuts (almonds): 579 cal
- Peanut butter: 588 cal (1 tbsp = 16g = 94 cal)
- Soy sauce: 53 cal/100ml (1 tbsp = 15ml = 8 cal)

CRITICAL: Do NOT skip oils, butter, cheese, or any ingredient. These add significant calories!

Format your response as a JSON array with this structure:
[
  {
    "title": "Recipe Name",
    "ingredients": ["2 medium carrots (122g), cut into chunks", "1 1/2 tablespoons olive oil (21ml)", "1/2 pound lean ground beef (227g)"],
    "instructions": [
      "Preheat the oven to 450 degrees F. Pulse the carrots, celery and shallots in a food processor until coarsely chopped.",
      "Heat 1 tablespoon of the olive oil in a large nonstick skillet over medium high. Add the chopped vegetables and cook, stirring frequently, until light golden and soft, 8 to 10 minutes. (Add a splash of water if the mixture begins to stick.)"
    ],
    "estimatedTime": "45 minutes",
    "servingSize": ${servingSize},
    "caloriesPerServing": 285
  }
]

CRITICAL REQUIREMENTS:
1. servingSize MUST be exactly ${servingSize}
2. Calculate calories for EVERY SINGLE ingredient using the process above
3. Sum ALL ingredients (don't skip oils, butter, cheese, etc.)
4. Divide by ${servingSize} to get per-serving calories
5. A main dish should typically be 300-800 cal/serving (verify your math!)
6. Instructions must be detailed and professional (Food Network/AllRecipes style)

VERIFICATION CHECKLIST before responding:
✓ Did I calculate calories for EVERY ingredient?
✓ Did I include oils, butter, and cheese in my calculations?
✓ Did I convert measurements to grams correctly?
✓ Does the total recipe calorie count make sense?
✓ Did I divide by ${servingSize} servings?
✓ Are the per-serving calories realistic for this type of dish?

Only return the JSON array, no additional text.`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse JSON response
    const recipes = JSON.parse(content);

    // Add unique IDs
    return recipes.map((recipe: any, index: number) => ({
      ...recipe,
      id: `recipe-${Date.now()}-${index}`,
    }));
  } catch (error) {
    console.error('Error getting recipe suggestions:', error);
    throw error;
  }
};

export const chatWithChef = async (
  recipe: Recipe,
  messages: Message[],
  userMessage: string
): Promise<{ response: string; updatedRecipe: Recipe }> => {
  try {
    const client = await initializeOpenAI();

    const systemPrompt = `You are a professional chef assistant and nutrition expert helping to modify a recipe.
Current recipe:
Title: ${recipe.title}
Ingredients: ${recipe.ingredients.join('\n')}
Instructions: ${recipe.instructions.join('\n')}
Time: ${recipe.estimatedTime}
Serving Size: ${recipe.servingSize} servings
Calories per Serving: ${recipe.caloriesPerServing} calories

When the user requests modifications, provide the updated recipe with detailed, professional cooking instructions.

Instructions should be comprehensive and include:
- Specific temperatures, times, and techniques
- Visual cues and textures (e.g., "until light golden and soft", "until the peppers are tender")
- Helpful tips in parentheses when needed
- Professional detail similar to Food Network or AllRecipes

CRITICAL: When modifying the recipe, you MUST recalculate calories using this exact process:

MANDATORY CALORIE CALCULATION PROCESS:
Step 1: For EACH ingredient, calculate exact calories:
  - Convert measurement to grams/ml
  - Calculate: (ingredient grams ÷ 100) × USDA calories per 100g

Step 2: Sum ALL ingredient calories (total recipe calories)

Step 3: Divide by number of servings

Step 4: Round to nearest 5 calories

USDA REFERENCE (per 100g unless noted):
Oils/Fats: Olive oil 884 cal/100ml (124 cal/tbsp), Butter 717 cal (100 cal/tbsp)
Proteins: Chicken breast 165-195 cal, Ground beef 250-273 cal, Salmon 208 cal, Eggs 72 cal each
Carbs: Pasta cooked 131 cal, Rice cooked 130 cal, Bread 265 cal, Potatoes 77 cal
Dairy: Cheddar 402 cal, Mozzarella 280 cal, Parmesan 431 cal, Heavy cream 340 cal/100ml
Vegetables: Broccoli 34 cal, Carrots 41 cal, Tomatoes 18 cal, Bell peppers 31 cal
Other: Sugar 387 cal (16 cal/tsp), Flour 364 cal, Peanut butter 588 cal (94 cal/tbsp)

DO NOT skip oils, butter, cheese, or any ingredient! Calculate ALL ingredients and sum them.

Provide the response in this JSON format:
{
  "response": "Your conversational response explaining the changes",
  "updatedRecipe": {
    "title": "Updated Recipe Name",
    "ingredients": ["2 medium carrots (122g), cut into chunks", "1 1/2 tablespoons olive oil (21ml)"],
    "instructions": [
      "Preheat the oven to 450 degrees F. Pulse the carrots, celery and shallots in a food processor until coarsely chopped.",
      "Heat 1 tablespoon of the olive oil in a large nonstick skillet over medium high. Add the chopped vegetables and cook, stirring frequently, until light golden and soft, 8 to 10 minutes. (Add a splash of water if the mixture begins to stick.)"
    ],
    "estimatedTime": "45 minutes",
    "servingSize": 4,
    "caloriesPerServing": 285
  }
}`;

    const chatMessages: any[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
      { role: 'user', content: userMessage },
    ];

    const completion = await client.chat.completions.create({
      model: 'gpt-4',
      messages: chatMessages,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(content);
      return {
        response: parsed.response,
        updatedRecipe: {
          ...recipe,
          ...parsed.updatedRecipe,
          id: recipe.id,
        },
      };
    } catch {
      // If not JSON, return as plain text response without updating recipe
      return {
        response: content,
        updatedRecipe: recipe,
      };
    }
  } catch (error) {
    console.error('Error chatting with chef:', error);
    throw error;
  }
};
