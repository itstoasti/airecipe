import React, { useEffect, useState } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Import screens
import ApiKeySetupScreen from './screens/ApiKeySetupScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import HomeScreen from './screens/HomeScreen';
import AllRecipesScreen from './screens/AllRecipesScreen';
import SavedRecipesScreen from './screens/SavedRecipesScreen';
import ChatToModifyScreen from './screens/ChatToModifyScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';
import PopularRecipesScreen from './screens/PopularRecipesScreen';
import AddRecipeScreen from './screens/AddRecipeScreen';
import MealPlanningScreen from './screens/MealPlanningScreen';
import ProfileScreen from './screens/ProfileScreen';
import PaywallScreen from './screens/PaywallScreen';

// Import utilities
import { getApiKey } from './utils/storage';

// Import contexts
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';

// Import types
import { RootStackParamList, MainTabParamList } from './types';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Recipes') {
            iconName = focused ? 'restaurant' : 'restaurant-outline';
          } else if (route.name === 'SavedRecipes') {
            iconName = focused ? 'bookmark' : 'bookmark-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 0,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="Recipes"
        component={AllRecipesScreen}
        options={{ tabBarLabel: 'Recipes' }}
      />
      <Tab.Screen
        name="SavedRecipes"
        component={SavedRecipesScreen}
        options={{ tabBarLabel: 'Saved' }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);
  const { isDark } = useTheme();
  const { user, loading: authLoading } = useAuth();
  const navigationRef = React.useRef<NavigationContainerRef<RootStackParamList>>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  // Re-check API key when user logs in
  useEffect(() => {
    if (user) {
      checkApiKey();
    }
  }, [user]);

  // Periodically check API key to handle async updates
  useEffect(() => {
    const interval = setInterval(() => {
      checkApiKey();
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const checkApiKey = async () => {
    try {
      const apiKey = await getApiKey();
      setHasApiKey(!!apiKey);
    } catch (error) {
      console.error('Error checking API key:', error);
      setHasApiKey(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer
        ref={navigationRef}
        onStateChange={() => {
          // Re-check API key when navigation state changes
          const currentRoute = navigationRef.current?.getCurrentRoute();
          if (currentRoute?.name === 'ApiKeySetup' || currentRoute?.name === 'Login') {
            checkApiKey();
          }
        }}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          {!user ? (
            // Auth Screens - shown when not logged in
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
              <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            </>
          ) : !hasApiKey ? (
            // Setup Screen - shown after login but before API key is set
            <Stack.Screen name="ApiKeySetup" component={ApiKeySetupScreen} />
          ) : (
            // Main App Screens - shown when logged in and API key is set
            <>
              <Stack.Screen name="MainTabs" component={MainTabs} />
              <Stack.Screen name="ChatToModify" component={ChatToModifyScreen} />
              <Stack.Screen name="ShoppingList" component={ShoppingListScreen} />
              <Stack.Screen name="PopularRecipes" component={PopularRecipesScreen} />
              <Stack.Screen name="AddRecipe" component={AddRecipeScreen} />
              <Stack.Screen name="MealPlanning" component={MealPlanningScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Paywall" component={PaywallScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <AppContent />
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
