import { Recipe } from '../types';

// Category keywords for intelligent auto-categorization
const CATEGORY_KEYWORDS = {
  Breakfast: [
    'breakfast', 'pancake', 'waffle', 'french toast', 'omelette', 'omelet', 'scrambled',
    'cereal', 'oatmeal', 'porridge', 'granola', 'muesli', 'bagel', 'croissant',
    'bacon', 'sausage', 'hash brown', 'frittata', 'quiche', 'eggs', 'egg',
    'breakfast burrito', 'breakfast sandwich', 'morning', 'brunch', 'avocado toast',
    'yogurt parfait', 'smoothie bowl', 'acai bowl'
  ],
  Lunch: [
    'lunch', 'sandwich', 'wrap', 'burger', 'panini', 'sub', 'hoagie',
    'salad', 'soup', 'bowl', 'burrito', 'taco', 'quesadilla', 'pizza',
    'ramen', 'noodle', 'pasta salad', 'chicken salad', 'tuna salad',
    'club sandwich', 'blt', 'grilled cheese', 'pita', 'falafel'
  ],
  Dinner: [
    'dinner', 'roast', 'grilled', 'baked', 'braised', 'stew', 'curry',
    'casserole', 'lasagna', 'spaghetti', 'fettuccine', 'linguine', 'penne',
    'risotto', 'paella', 'steak', 'chicken breast', 'salmon', 'cod',
    'pork chop', 'lamb', 'beef', 'pot roast', 'meatloaf', 'shepherd pie',
    'enchilada', 'stroganoff', 'wellington', 'biryani', 'stir fry', 'fried rice',
    'pot pie', 'chicken pot pie', 'beef pot pie', 'turkey pot pie'
  ],
  Snacks: [
    'snack', 'chips', 'popcorn', 'pretzel', 'cracker', 'trail mix', 'nuts',
    'energy ball', 'protein bar', 'granola bar', 'dip', 'hummus', 'guacamole',
    'salsa', 'bruschetta', 'crostini', 'cheese plate', 'charcuterie',
    'deviled egg', 'spring roll', 'samosa', 'empanada', 'nacho', 'wings',
    'finger food', 'appetizer', 'bite', 'munchies'
  ],
  Drinks: [
    'drink', 'smoothie', 'shake', 'juice', 'lemonade', 'iced tea', 'tea',
    'coffee', 'latte', 'cappuccino', 'mocha', 'frappuccino', 'milkshake',
    'cocktail', 'mocktail', 'punch', 'agua fresca', 'horchata',
    'hot chocolate', 'cocoa', 'cider', 'eggnog', 'lassi', 'bubble tea',
    'infused water', 'detox water', 'protein shake', 'energy drink'
  ],
  Desserts: [
    'dessert', 'cake', 'cookie', 'brownie', 'cupcake', 'muffin', 'pie',
    'tart', 'cheesecake', 'pudding', 'mousse', 'tiramisu', 'gelato',
    'ice cream', 'sorbet', 'popsicle', 'fudge', 'truffle', 'bonbon',
    'macaron', 'eclair', 'donut', 'doughnut', 'cinnamon roll', 'danish',
    'cobbler', 'crisp', 'crumble', 'parfait', 'sundae', 'candy', 'chocolate',
    'sweet', 'pastry', 'biscotti', 'cannoli', 'baklava', 'flan'
  ]
};

/**
 * Automatically categorizes a recipe based on its title and ingredients
 * Uses keyword matching and intelligent analysis
 */
export const autoCategorizeRecipe = (recipe: Recipe): string => {
  // If recipe already has a category, keep it
  if (recipe.category && recipe.category !== 'Uncategorized') {
    return recipe.category;
  }

  const titleLower = recipe.title.toLowerCase();
  const ingredientsText = recipe.ingredients.join(' ').toLowerCase();
  const combinedText = `${titleLower} ${ingredientsText}`;

  // Score each category based on keyword matches
  const categoryScores: { [key: string]: number } = {
    Breakfast: 0,
    Lunch: 0,
    Dinner: 0,
    Snacks: 0,
    Drinks: 0,
    Desserts: 0
  };

  // Check each category's keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      // Higher weight for title matches
      if (titleLower.includes(keyword)) {
        categoryScores[category] += 5;
      }
      // Lower weight for ingredient matches
      if (ingredientsText.includes(keyword)) {
        categoryScores[category] += 1;
      }
    }
  }

  // Special rules for ambiguous cases

  // If it has dessert-like ingredients but no dessert keywords in title
  const dessertIngredients = ['sugar', 'chocolate', 'vanilla', 'frosting', 'icing', 'cream cheese'];
  const hasDessertIngredients = dessertIngredients.some(ing => ingredientsText.includes(ing));
  if (hasDessertIngredients && !titleLower.includes('sauce') && !titleLower.includes('glaze')) {
    categoryScores.Desserts += 2;
  }

  // If it's a beverage
  const beverageIndicators = ['cup', 'glass', 'drink', 'beverage', 'liquid'];
  const isBeverage = beverageIndicators.some(ind => titleLower.includes(ind)) &&
                     ingredientsText.includes('water') || ingredientsText.includes('milk') ||
                     ingredientsText.includes('juice');
  if (isBeverage) {
    categoryScores.Drinks += 3;
  }

  // Time-based inference from cooking method
  const quickCookingMethods = ['no-bake', 'no bake', 'raw', 'blended', 'mixed', 'assembled'];
  const isQuick = quickCookingMethods.some(method => combinedText.includes(method));

  const longCookingMethods = ['slow cook', 'roast', 'braise', 'stew', 'bake'];
  const isLongCooking = longCookingMethods.some(method => combinedText.includes(method));

  if (isLongCooking && categoryScores.Dinner > 0) {
    categoryScores.Dinner += 2;
  }

  // Find the category with the highest score
  let maxScore = 0;
  let bestCategory = 'Dinner'; // Default fallback

  for (const [category, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  // If no clear match (score is 0), use intelligent defaults
  if (maxScore === 0) {
    // Check for main protein indicators
    const mainProteins = ['chicken', 'beef', 'pork', 'fish', 'salmon', 'steak', 'lamb'];
    const hasMainProtein = mainProteins.some(protein => combinedText.includes(protein));

    if (hasMainProtein) {
      return 'Dinner';
    }

    // Check for small portion indicators
    const smallPortions = ['bite', 'mini', 'small', 'appetizer'];
    const isSmallPortion = smallPortions.some(portion => titleLower.includes(portion));

    if (isSmallPortion) {
      return 'Snacks';
    }

    // Default to Dinner for main dishes
    return 'Dinner';
  }

  return bestCategory;
};

/**
 * Batch categorize multiple recipes
 */
export const autoCategorizeRecipes = (recipes: Recipe[]): Recipe[] => {
  return recipes.map(recipe => ({
    ...recipe,
    category: autoCategorizeRecipe(recipe)
  }));
};
