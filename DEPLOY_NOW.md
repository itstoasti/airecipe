# Quick Deployment Guide

## You Need:
- ✅ OpenAI API Key (from platform.openai.com)
- ✅ FAL API Key (from fal.ai)

---

## Option 1: Automatic Deployment (EASIEST)

**Double-click this file:**
```
deploy-supabase.bat
```

It will:
1. Open browser for Supabase login
2. Link your project
3. Ask for your API keys
4. Deploy all 3 Edge Functions

---

## Option 2: Manual Deployment

Open **PowerShell** or **Command Prompt** and run these commands:

### Step 1: Navigate to project
```bash
cd "C:\Users\deanf\OneDrive\Desktop\projects\ai recipe"
```

### Step 2: Login (opens browser)
```bash
supabase login
```

### Step 3: Link project
```bash
supabase link --project-ref hlyrnwalexksdzibduhm
```
**When prompted for database password:**
- Go to Supabase Dashboard → Settings → Database
- Copy your database password
- Paste it in the terminal

### Step 4: Set API Keys
```bash
supabase secrets set OPENAI_API_KEY=sk-your-openai-key-here
supabase secrets set FAL_API_KEY=your-fal-key-here
```
**Replace with your actual keys!**

### Step 5: Deploy Functions
```bash
supabase functions deploy generate-recipe --no-verify-jwt
supabase functions deploy generate-image --no-verify-jwt
supabase functions deploy chat-with-chef --no-verify-jwt
```

### Step 6: Verify
```bash
supabase functions list
supabase secrets list
```

---

## What You Should See:

### After `supabase functions list`:
```
┌─────────────────┬─────────────┬──────────────────┐
│     NAME        │   STATUS    │    UPDATED AT    │
├─────────────────┼─────────────┼──────────────────┤
│ generate-recipe │   DEPLOYED  │   2 minutes ago  │
│ generate-image  │   DEPLOYED  │   2 minutes ago  │
│ chat-with-chef  │   DEPLOYED  │   2 minutes ago  │
└─────────────────┴─────────────┴──────────────────┘
```

### After `supabase secrets list`:
```
OPENAI_API_KEY
FAL_API_KEY
SUPABASE_URL
SUPABASE_ANON_KEY
```

---

## Troubleshooting

### "command not found: supabase"
Restart your terminal after installation

### "Unauthorized" or "Access denied"
Make sure you:
1. Ran `supabase login` first
2. Used the correct project ref: `hlyrnwalexksdzibduhm`
3. Have owner/admin access to the Supabase project

### "Failed to deploy function"
Check that you're in the project root directory:
```bash
pwd  # Should show: C:\Users\deanf\OneDrive\Desktop\projects\ai recipe
```

### Database password prompt
- Go to **Supabase Dashboard** → **Settings** → **Database**
- Look for "Database password"
- If you forgot it, you can reset it

---

## After Deployment

Your API keys are now **secure** on Supabase servers!

Next, I need to update your app code to use the Edge Functions instead of direct API calls.

**Tell me when deployment is complete!**
