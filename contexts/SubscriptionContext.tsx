import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Purchases, { PurchasesOffering, CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Free tier limits
export const FREE_TIER_LIMITS = {
  DAILY_RECIPE_GENERATIONS: 3,
  MAX_SAVED_RECIPES: 10,
};

interface SubscriptionContextType {
  isPro: boolean;
  isLoading: boolean;
  offerings: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  purchasePackage: (packageToPurchase: PurchasesPackage) => Promise<void>;
  restorePurchases: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
  // Usage tracking
  dailyGenerationsCount: number;
  savedRecipesCount: number;
  canGenerateRecipe: () => boolean;
  canSaveRecipe: () => boolean;
  incrementDailyGenerations: () => Promise<void>;
  resetDailyGenerations: () => Promise<void>;
  updateSavedRecipesCount: (count: number) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// RevenueCat Public SDK Key (Google Play)
const REVENUECAT_API_KEY = 'goog_afwSSRUziZnqoIyzqjwUPtAxZfY';

interface Props {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: Props) {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [dailyGenerationsCount, setDailyGenerationsCount] = useState(0);
  const [savedRecipesCount, setSavedRecipesCount] = useState(0);

  useEffect(() => {
    if (user) {
      initializePurchases();
      loadUsageData();
    }
  }, [user]);

  const initializePurchases = async () => {
    try {
      // Configure RevenueCat
      await Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: user?.id });

      // Get customer info
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);

      // Check if user has active subscription
      const isProUser = info.entitlements.active['pro'] !== undefined;
      setIsPro(isProUser);

      // Get available offerings
      const offerings = await Purchases.getOfferings();
      if (offerings.current) {
        setOfferings(offerings.current);
      }
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
      // If RevenueCat is not configured, run in development mode
      if (__DEV__) {
        console.log('Running in dev mode without RevenueCat');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsageData = async () => {
    try {
      const today = new Date().toDateString();
      const storedDate = await AsyncStorage.getItem('lastGenerationDate');
      const storedCount = await AsyncStorage.getItem('dailyGenerationsCount');

      // Reset count if it's a new day
      if (storedDate !== today) {
        await resetDailyGenerations();
      } else if (storedCount) {
        setDailyGenerationsCount(parseInt(storedCount, 10));
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
    }
  };

  const purchasePackage = async (packageToPurchase: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      setCustomerInfo(customerInfo);
      const isProUser = customerInfo.entitlements.active['pro'] !== undefined;
      setIsPro(isProUser);
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Error purchasing package:', error);
        throw error;
      }
    }
  };

  const restorePurchases = async () => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      const isProUser = info.entitlements.active['pro'] !== undefined;
      setIsPro(isProUser);
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    }
  };

  const checkSubscriptionStatus = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      const isProUser = info.entitlements.active['pro'] !== undefined;
      setIsPro(isProUser);
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const canGenerateRecipe = (): boolean => {
    if (isPro) return true;
    return dailyGenerationsCount < FREE_TIER_LIMITS.DAILY_RECIPE_GENERATIONS;
  };

  const canSaveRecipe = (): boolean => {
    if (isPro) return true;
    return savedRecipesCount < FREE_TIER_LIMITS.MAX_SAVED_RECIPES;
  };

  const incrementDailyGenerations = async () => {
    const newCount = dailyGenerationsCount + 1;
    setDailyGenerationsCount(newCount);
    try {
      await AsyncStorage.setItem('dailyGenerationsCount', newCount.toString());
      await AsyncStorage.setItem('lastGenerationDate', new Date().toDateString());
    } catch (error) {
      console.error('Error saving generation count:', error);
    }
  };

  const resetDailyGenerations = async () => {
    setDailyGenerationsCount(0);
    try {
      await AsyncStorage.setItem('dailyGenerationsCount', '0');
      await AsyncStorage.setItem('lastGenerationDate', new Date().toDateString());
    } catch (error) {
      console.error('Error resetting generation count:', error);
    }
  };

  const updateSavedRecipesCount = (count: number) => {
    setSavedRecipesCount(count);
  };

  const value = {
    isPro,
    isLoading,
    offerings,
    customerInfo,
    purchasePackage,
    restorePurchases,
    checkSubscriptionStatus,
    dailyGenerationsCount,
    savedRecipesCount,
    canGenerateRecipe,
    canSaveRecipe,
    incrementDailyGenerations,
    resetDailyGenerations,
    updateSavedRecipesCount,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
