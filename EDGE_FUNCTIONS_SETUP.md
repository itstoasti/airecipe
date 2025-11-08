# Supabase Edge Functions Setup Guide

This guide explains how to deploy Supabase Edge Functions for **secure server-side API key management**.

## 🔒 Why Edge Functions?

**Before (INSECURE):**
- ❌ API keys stored on user devices
- ❌ Users can extract and steal keys
- ❌ No rate limiting control

**After (SECURE):**
- ✅ API keys stay on server (never exposed)
- ✅ Users can't access keys
- ✅ Full control over rate limiting
- ✅ Better security and cost control

---

## Prerequisites

1. **Node.js** installed
2. **Supabase project** created
3. **OpenAI API key** (from platform.openai.com)
4. **FAL API key** (from fal.ai)

---

## Step 1: Install Supabase CLI

### Windows (PowerShell):
```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### macOS/Linux:
```bash
brew install supabase/tap/supabase
```

### Verify installation:
```bash
supabase --version
```

---

## Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window. Authorize the CLI.

---

## Step 3: Link Your Project

```bash
cd "C:\Users\deanf\OneDrive\Desktop\projects\ai recipe"
supabase link --project-ref hlyrnwalexksdzibduhm
```

When prompted, enter your **database password** from Supabase dashboard.

---

## Step 4: Set Environment Variables (Secrets)

These secrets are stored securely on Supabase servers and **never exposed to clients**.

### Set OpenAI API Key:
```bash
supabase secrets set OPENAI_API_KEY=sk-your-openai-key-here
```

### Set FAL API Key:
```bash
supabase secrets set FAL_API_KEY=your-fal-key-here
```

### Verify secrets are set:
```bash
supabase secrets list
```

You should see:
- `OPENAI_API_KEY`
- `FAL_API_KEY`
- `SUPABASE_URL` (auto-set)
- `SUPABASE_ANON_KEY` (auto-set)

---

## Step 5: Deploy Edge Functions

Deploy all three functions:

```bash
supabase functions deploy generate-recipe
supabase functions deploy generate-image
supabase functions deploy chat-with-chef
```

### Expected output:
```
Deploying Function (project-ref: hlyrnwalexksdzibduhm)...
✓ Function deployed successfully
```

---

## Step 6: Test the Functions

### Test Recipe Generation:
```bash
curl -X POST \
  'https://hlyrnwalexksdzibduhm.supabase.co/functions/v1/generate-recipe' \
  -H 'Authorization: Bearer YOUR_USER_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "pasta",
    "servingSize": 4
  }'
```

### Test Image Generation:
```bash
curl -X POST \
  'https://hlyrnwalexksdzibduhm.supabase.co/functions/v1/generate-image' \
  -H 'Authorization: Bearer YOUR_USER_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "recipeTitle": "Spaghetti Carbonara",
    "ingredients": ["pasta", "eggs", "bacon"]
  }'
```

**Note:** Replace `YOUR_USER_ACCESS_TOKEN` with an actual token from your app.

---

## Step 7: Update Your App Code

### Option A: Use the New Edge Function Service (RECOMMENDED)

Replace imports in your screens:

**Before:**
```typescript
import { getRecipeSuggestions } from '../utils/openaiService';
```

**After:**
```typescript
import { getRecipeSuggestions } from '../utils/edgeFunctionService';
```

### Screens to update:
1. **`screens/HomeScreen.tsx`**
   - Change import to `edgeFunctionService`

2. **`screens/ChatToModifyScreen.tsx`**
   - Change import to `edgeFunctionService`

3. **`screens/AddRecipeScreen.tsx`** (if using image generation)
   - Change import to `edgeFunctionService`

The function signatures remain the same:
```typescript
const recipes = await getRecipeSuggestions(query, servingSize, session.access_token);
```

---

## Step 8: Remove Old Files (Optional)

Once everything works, you can remove:
- ❌ `utils/apiKeyService.ts` (not needed)
- ❌ `supabase_migration_api_keys.sql` (not needed)
- ❌ `API_KEYS_SETUP.md` (old approach)
- ❌ API key input sections from `ProfileScreen.tsx`

**Keep:**
- ✅ `utils/edgeFunctionService.ts` (new secure service)
- ✅ `supabase/functions/*` (Edge Functions)

---

## Troubleshooting

### Error: "command not found: supabase"
- Restart your terminal after installation
- Verify PATH is set correctly

### Error: "Unauthorized"
- User must be logged in
- Check `session.access_token` is valid
- Test with `supabase auth status`

### Error: "OPENAI_API_KEY not configured"
- Verify secrets are set: `supabase secrets list`
- Re-deploy functions after setting secrets

### Error: "Failed to deploy function"
- Check syntax in `.ts` files
- Ensure you're in the project root directory
- Try: `supabase functions deploy --no-verify-jwt generate-recipe`

### Functions not updating after changes
```bash
# Redeploy after making changes
supabase functions deploy generate-recipe --no-verify-jwt
```

---

## Monitoring & Logs

### View function logs:
```bash
supabase functions logs generate-recipe
```

### View all function invocations:
Go to **Supabase Dashboard** → **Edge Functions** → Select function → **Logs**

---

## Cost Considerations

### OpenAI API Costs:
- Model: `gpt-4o-mini`
- ~$0.15 per 1M input tokens
- ~$0.60 per 1M output tokens
- Estimate: ~$0.01 per recipe generation

### FAL API Costs:
- Model: `nano-banana`
- ~$0.003 per image
- Very affordable for image generation

### Supabase Edge Functions:
- **FREE tier:** 500K function invocations/month
- **Pro tier:** 2M invocations/month included
- Extremely generous limits

**Total estimated cost per user per month:** <$1

---

## Security Best Practices

### ✅ DO:
- Keep API keys in Supabase secrets
- Rotate keys periodically
- Monitor usage in OpenAI/FAL dashboards
- Implement rate limiting if needed

### ❌ DON'T:
- Never commit secrets to Git
- Never expose keys to client
- Don't share keys in logs
- Don't hardcode keys in functions

---

## Testing in Development

### Local testing (optional):
```bash
# Start local Supabase
supabase start

# Serve function locally
supabase functions serve generate-recipe --env-file ./supabase/.env.local

# Test locally
curl -X POST 'http://localhost:54321/functions/v1/generate-recipe' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{"query":"pasta","servingSize":4}'
```

---

## Production Checklist

Before launching:

- [ ] All Edge Functions deployed
- [ ] Secrets configured (OPENAI_API_KEY, FAL_API_KEY)
- [ ] Functions tested and working
- [ ] App updated to use `edgeFunctionService`
- [ ] Old insecure code removed
- [ ] Tested end-to-end flow
- [ ] Monitoring set up
- [ ] API keys rotated from any dev/test exposure

---

## Need Help?

- **Supabase Edge Functions Docs:** https://supabase.com/docs/guides/functions
- **Supabase CLI Docs:** https://supabase.com/docs/reference/cli/introduction
- **Deno Deploy Docs:** https://deno.com/deploy/docs

---

## Summary

Your API keys are now **100% secure**:
- ✅ Stored as environment secrets on Supabase
- ✅ Never exposed to client devices
- ✅ Impossible for users to extract
- ✅ Full control over usage and costs

Users can still:
- ✅ Generate recipes
- ✅ Create images
- ✅ Chat with the chef
- ❌ But they **cannot** steal your API keys!
