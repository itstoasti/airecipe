# Subscription System Setup Guide

This app now includes a free/paid subscription system using RevenueCat. Follow these steps to complete the setup:

## Features

**Free Tier:**
- 3 recipe generations per day
- Save up to 10 recipes
- Ads displayed (when implemented)

**Pro Tier:**
- Unlimited recipe generations
- Unlimited saved recipes
- Ad-free experience
- Priority support

## Setup Steps

### 1. Create a RevenueCat Account

1. Go to [revenuecat.com](https://www.revenuecat.com)
2. Sign up for a free account
3. Create a new app/project

### 2. Configure RevenueCat

1. **Add Your App:**
   - In RevenueCat dashboard, go to "Apps"
   - Click "Add New" and select your platform (iOS and/or Android)
   - Enter your bundle IDs (found in `app.json`):
     - **iOS:** `com.airecipeapp` (line 24 in app.json)
     - **Android:** `com.airecipeapp` (line 31 in app.json)

2. **Create Products:**
   - Go to "Products" in RevenueCat dashboard
   - Create two subscription products:
     - **Monthly**: `pro_monthly` - $4.99/month
     - **Yearly**: `pro_annual` - $29.99/year

3. **Create Entitlement:**
   - Go to "Entitlements"
   - Create an entitlement called `pro`
   - Attach both monthly and yearly products to this entitlement

4. **Create Offerings:**
   - Go to "Offerings"
   - Create a new offering (mark as default)
   - Add both products (monthly and yearly packages)

### 3. Get Your API Keys

1. Go to RevenueCat dashboard → API Keys
2. Copy your **Public SDK Key**
3. Update `contexts/SubscriptionContext.tsx`:
   ```typescript
   const REVENUECAT_API_KEY = __DEV__
     ? 'YOUR_PUBLIC_SDK_KEY_HERE'
     : 'YOUR_PUBLIC_SDK_KEY_HERE';
   ```

### 4. Configure App Store/Play Store

**For iOS (App Store Connect):**
1. Create in-app purchase subscriptions in App Store Connect
2. Use these IDs:
   - Monthly: `pro_monthly`
   - Yearly: `pro_annual`
3. Link them in RevenueCat dashboard

**For Android (Google Play Console):**
1. Create subscription products in Google Play Console
2. Use the same IDs: `pro_monthly` and `pro_annual`
3. Link them in RevenueCat dashboard

### 5. Test Your Integration

RevenueCat provides **Sandbox Testing**:
1. Enable sandbox mode in RevenueCat dashboard
2. Use test accounts for iOS/Android
3. Test purchase flow without real charges

### 6. Update Privacy Policy

Add subscription terms to your privacy policy:
- Subscription details (pricing, renewal)
- Cancellation policy
- Refund policy
- Link to Apple's/Google's terms

## Code Implementation

The subscription system is already integrated:

✅ **SubscriptionContext** (`contexts/SubscriptionContext.tsx`)
- Manages subscription state
- Tracks usage (generations, saved recipes)
- Provides hooks for feature gating

✅ **PaywallScreen** (`screens/PaywallScreen.tsx`)
- Beautiful subscription UI
- Monthly and yearly options
- Restore purchases functionality

✅ **Feature Gating** (Ready to implement)
- Check `canGenerateRecipe()` before generating
- Check `canSaveRecipe()` before saving
- Show paywall when limits reached

## Usage in Your App

### Check if user is Pro:
```typescript
import { useSubscription } from './contexts/SubscriptionContext';

const { isPro, canGenerateRecipe, canSaveRecipe } = useSubscription();

if (!canGenerateRecipe()) {
  // Show paywall or limit message
  navigation.navigate('Paywall');
  return;
}
```

### Navigate to Paywall:
```typescript
navigation.navigate('Paywall');
```

### Track Usage:
```typescript
const { incrementDailyGenerations, updateSavedRecipesCount } = useSubscription();

// After generating a recipe
await incrementDailyGenerations();

// Update saved recipes count
const savedRecipes = await getSavedRecipes();
updateSavedRecipesCount(savedRecipes.length);
```

## Next Steps

1. ✅ RevenueCat SDK installed
2. ✅ Subscription context created
3. ✅ Paywall screen designed
4. ⏳ **Configure RevenueCat account** (follow steps above)
5. ⏳ **Implement feature gating** in HomeScreen and SavedRecipesScreen
6. ⏳ **Add subscription status** to Profile screen
7. ⏳ **Test thoroughly** in sandbox mode
8. ⏳ **Submit for review** to App Store and Play Store

## Support

For RevenueCat support:
- [Documentation](https://docs.revenuecat.com)
- [Community](https://community.revenuecat.com)
- Support email: support@revenuecat.com

For code issues, check the inline comments in:
- `contexts/SubscriptionContext.tsx`
- `screens/PaywallScreen.tsx`
