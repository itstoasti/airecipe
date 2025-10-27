# Secure API Keys Setup with Supabase

This guide explains how to securely store OpenAI and FAL API keys server-side in Supabase instead of on user devices.

## Why Server-Side Storage?

**Security Benefits:**
- ✅ API keys never exposed in client app
- ✅ Keys can't be extracted from app bundle
- ✅ Centralized key management
- ✅ Easy key rotation without app updates
- ✅ Better cost control

**Before:** Keys stored in AsyncStorage (insecure)
**After:** Keys stored in Supabase (secure)

## Setup Instructions

###  1. Run the SQL Migration

1. Go to your **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the contents of `supabase_migration_api_keys.sql`
6. **IMPORTANT:** Replace the placeholder keys with your actual keys:
   ```sql
   INSERT INTO api_keys (key_name, key_value)
   VALUES
     ('openai_api_key', 'sk-YOUR-ACTUAL-OPENAI-KEY-HERE'),
     ('fal_api_key', 'YOUR-ACTUAL-FAL-KEY-HERE')
   ```
7. Click **Run** to execute the migration

### 2. Verify the Setup

Run this query to confirm your keys are stored:
```sql
SELECT key_name, created_at FROM api_keys;
```

You should see:
- `openai_api_key`
- `fal_api_key`

**NEVER** run `SELECT *` in production as it would expose the key values!

### 3. Update Your Screens

The following files need to pass `accessToken` to the API functions:

#### HomeScreen.tsx
```typescript
// Add to imports
import { useAuth } from '../contexts/AuthContext';

// In component
const { session } = useAuth();

// When calling getRecipeSuggestions
const recipes = await getRecipeSuggestions(
  query,
  servingSize,
  session?.access_token || ''
);
```

#### ChatToModifyScreen.tsx
```typescript
// Add to imports
import { useAuth } from '../contexts/AuthContext';

// In component
const { session } = useAuth();

// When calling chatWithChef
const result = await chatWithChef(
  recipe,
  messages,
  input,
  session?.access_token || ''
);
```

#### AddRecipeScreen.tsx
```typescript
// If using generateCustomImage
const imageUrl = await generateCustomImage(
  prompt,
  session?.access_token || ''
);
```

### 4. Remove API Key UI from Profile

The Profile screen no longer needs API key input fields since keys are server-side.

**Optional:** Remove the API key sections or add a message:
```typescript
<Text>API keys are securely managed server-side</Text>
```

## Security Features

### Row Level Security (RLS)
- Only authenticated users can read keys
- Only service role can modify keys
- Keys are never exposed to unauthorized users

### Secure Function
The `get_api_key()` function:
- Checks user authentication
- Returns only the specific key requested
- Logs access for auditing

### Caching
Keys are cached in memory during the session to reduce database calls.

## Managing Keys

### Update a Key
```sql
UPDATE api_keys
SET key_value = 'new-key-value',
    updated_at = NOW()
WHERE key_name = 'openai_api_key';
```

### Add a New Key
```sql
INSERT INTO api_keys (key_name, key_value)
VALUES ('new_service_key', 'key-value-here');
```

### View Key Metadata (Safe)
```sql
SELECT key_name, created_at, updated_at
FROM api_keys;
```

## Testing

1. Sign in to your app
2. Try generating a recipe
3. Check console logs for:
   ```
   Generating images for recipes...
   ```
4. If you see errors about missing keys, verify:
   - SQL migration ran successfully
   - Keys are inserted in database
   - User is authenticated

## Troubleshooting

### Error: "API key not found"
- Check that SQL migration ran
- Verify keys exist in database
- Ensure user is authenticated

### Error: "Unauthorized"
- User must be logged in
- Check `session.access_token` is valid
- RLS policies must be enabled

### Error: "Failed to fetch API key"
- Check Supabase URL in `apiKeyService.ts`
- Verify ANON key is correct
- Check network connection

## Production Checklist

Before deploying to production:

- [ ] API keys added to Supabase
- [ ] SQL migration executed
- [ ] All screens updated to pass access_token
- [ ] AsyncStorage API key code removed
- [ ] Test key retrieval works
- [ ] Test recipe generation works
- [ ] Test image generation works
- [ ] RLS policies verified
- [ ] Keys rotated from any dev/test exposure

## Cost Considerations

With server-side keys:
- All users share the same API keys
- You pay for all API usage
- Consider implementing usage limits per user
- Monitor API costs in OpenAI/FAL dashboards

## Alternative: User-Provided Keys

If you want users to provide their own keys (original approach):
1. Don't run the migration
2. Keep AsyncStorage code
3. Users manage their own API costs

---

**Need Help?**
- Supabase Docs: https://supabase.com/docs
- RevenueCat Docs: https://docs.revenuecat.com
