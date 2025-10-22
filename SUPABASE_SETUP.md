# Supabase Setup Instructions

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - Project name: "ai-recipe-app"
   - Database password: (create a secure password)
   - Region: Choose closest to your users
5. Click "Create new project"

## Step 2: Create the Recipes Table

1. In your Supabase dashboard, go to the SQL Editor
2. Click "New Query"
3. Paste the following SQL:

```sql
-- Create recipes table
CREATE TABLE recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  ingredients TEXT[] NOT NULL,
  instructions TEXT[] NOT NULL,
  estimated_time TEXT NOT NULL,
  serving_size INTEGER NOT NULL,
  calories_per_serving INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  view_count INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT FALSE
);

-- Create index for popular recipes query
CREATE INDEX idx_recipes_view_count ON recipes(view_count DESC);
CREATE INDEX idx_recipes_is_popular ON recipes(is_popular);

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(recipe_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE recipes
  SET view_count = view_count + 1
  WHERE id = recipe_id;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON recipes
  FOR SELECT USING (true);

-- Create policy to allow public insert access
CREATE POLICY "Allow public insert access" ON recipes
  FOR INSERT WITH CHECK (true);

-- Create policy to allow public update access
CREATE POLICY "Allow public update access" ON recipes
  FOR UPDATE USING (true);
```

4. Click "Run"

## Step 3: Get Your API Credentials

1. In your Supabase dashboard, go to Settings → API
2. Copy your:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (a long string starting with `eyJ...`)

## Step 4: Update Your App Configuration

1. Open `utils/supabaseClient.ts`
2. Replace the placeholders:

```typescript
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Replace with your Project URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Anon key
```

## How It Works

### Saving Recipes
- Every time a user generates recipes using AI, they are automatically saved to the database
- This builds up a collection of recipes over time
- Duplicates are handled by the unique ID

### Popular Recipes
- When users click "Popular", it fetches recipes from the database sorted by view count
- If no popular recipes exist yet, it falls back to AI generation
- View counts increment when users view recipes (can be implemented in ChatToModifyScreen)

### Cost Savings
- Popular recipes come from the database, not AI
- As more users use the app, more recipes are cached
- Reduces OpenAI API calls significantly over time

## Optional: Implement View Tracking

To track which recipes are actually viewed (for better popularity metrics), add this to `ChatToModifyScreen.tsx`:

```typescript
import { incrementRecipeViewCount } from '../utils/recipeDatabase';

// In the component, add useEffect:
useEffect(() => {
  if (recipe.id) {
    incrementRecipeViewCount(recipe.id);
  }
}, [recipe.id]);
```

## Testing

1. Generate some recipes using the app
2. Check your Supabase dashboard → Table Editor → recipes
3. You should see the recipes appear
4. Click "Popular" button - it should show those recipes
5. View a recipe multiple times to increase its view_count
6. The most viewed recipes will appear first when clicking "Popular"
