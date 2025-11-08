import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { getUsageStats, FREE_TIER_LIMITS } from '../utils/usageTracking';
import { getSavedRecipesCount } from '../utils/storage';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

export default function ProfileScreen({ navigation }: Props) {
  const { colors, isDark, setThemeMode, themeMode } = useTheme();
  const { user, signOut } = useAuth();
  const { isPro, customerInfo } = useSubscription();
  const [recipesGeneratedToday, setRecipesGeneratedToday] = useState(0);
  const [savedRecipesCount, setSavedRecipesCount] = useState(0);

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    try {
      const usage = await getUsageStats();
      const savedCount = await getSavedRecipesCount();
      setRecipesGeneratedToday(usage.recipesGeneratedToday);
      setSavedRecipesCount(savedCount);
    } catch (error) {
      console.error('Error loading usage stats:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation will be handled automatically by App.tsx when user state changes
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* User Info Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <Text style={[styles.email, { color: colors.text }]}>{user?.email}</Text>
          <Text style={[styles.memberSince, { color: colors.textSecondary }]}>
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
          </Text>
        </View>

        {/* Subscription Section */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Subscription</Text>
          <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
            <View style={styles.subscriptionHeader}>
              <View>
                <Text style={[styles.subscriptionStatus, { color: colors.text }]}>
                  {isPro ? 'Pro Member ✨' : 'Free Plan'}
                </Text>
                <Text style={[styles.subscriptionDetail, { color: colors.textSecondary }]}>
                  {isPro
                    ? 'You have access to all premium features'
                    : 'Upgrade to unlock unlimited recipes'}
                </Text>
              </View>
              {isPro && (
                <View style={[styles.proBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>

            {/* Usage Stats */}
            <View style={[styles.usageSection, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <View style={styles.usageRow}>
                <View style={styles.usageItem}>
                  <Ionicons name="restaurant-outline" size={20} color={colors.primary} />
                  <View style={styles.usageTextContainer}>
                    <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>Recipes Today</Text>
                    <Text style={[styles.usageValue, { color: colors.text }]}>
                      {isPro
                        ? 'Unlimited ♾️'
                        : `${recipesGeneratedToday}/${FREE_TIER_LIMITS.DAILY_RECIPE_GENERATIONS}`}
                    </Text>
                  </View>
                </View>
                <View style={styles.usageItem}>
                  <Ionicons name="bookmark-outline" size={20} color={colors.teal} />
                  <View style={styles.usageTextContainer}>
                    <Text style={[styles.usageLabel, { color: colors.textSecondary }]}>Saved Recipes</Text>
                    <Text style={[styles.usageValue, { color: colors.text }]}>
                      {isPro
                        ? `${savedRecipesCount} (Unlimited)`
                        : `${savedRecipesCount}/${FREE_TIER_LIMITS.MAX_SAVED_RECIPES}`}
                    </Text>
                  </View>
                </View>
              </View>
              {!isPro && recipesGeneratedToday >= FREE_TIER_LIMITS.DAILY_RECIPE_GENERATIONS && (
                <View style={[styles.limitWarning, { backgroundColor: colors.background }]}>
                  <Ionicons name="alert-circle" size={16} color={colors.primary} />
                  <Text style={[styles.limitWarningText, { color: colors.primary }]}>
                    Daily limit reached. Resets tomorrow.
                  </Text>
                </View>
              )}
              {!isPro && savedRecipesCount >= FREE_TIER_LIMITS.MAX_SAVED_RECIPES && (
                <View style={[styles.limitWarning, { backgroundColor: colors.background }]}>
                  <Ionicons name="alert-circle" size={16} color={colors.primary} />
                  <Text style={[styles.limitWarningText, { color: colors.primary }]}>
                    Storage limit reached. Delete recipes to save more.
                  </Text>
                </View>
              )}
            </View>

            {!isPro && (
              <TouchableOpacity
                style={[styles.upgradeButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Paywall')}
              >
                <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            )}

            {__DEV__ && (
              <View style={[styles.debugInfo, { backgroundColor: colors.inputBackground, marginTop: 12 }]}>
                <Text style={[styles.debugText, { color: colors.textSecondary }]}>
                  Debug: isPro = {isPro ? 'true' : 'false'}
                </Text>
                <Text style={[styles.debugText, { color: colors.textSecondary }]}>
                  Active entitlements: {customerInfo?.entitlements?.active ? Object.keys(customerInfo.entitlements.active).join(', ') || 'none' : 'none'}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Theme Section */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
            <View style={styles.themeButtons}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: themeMode === 'light' ? colors.primary : colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleThemeChange('light')}
              >
                <Ionicons
                  name="sunny"
                  size={20}
                  color={themeMode === 'light' ? '#fff' : colors.text}
                />
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: themeMode === 'light' ? '#fff' : colors.text },
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: themeMode === 'dark' ? colors.primary : colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleThemeChange('dark')}
              >
                <Ionicons
                  name="moon"
                  size={20}
                  color={themeMode === 'dark' ? '#fff' : colors.text}
                />
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: themeMode === 'dark' ? '#fff' : colors.text },
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: themeMode === 'system' ? colors.primary : colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleThemeChange('system')}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={themeMode === 'system' ? '#fff' : colors.text}
                />
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: themeMode === 'system' ? '#fff' : colors.text },
                  ]}
                >
                  System
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <TouchableOpacity
            style={[styles.settingCard, styles.signOutButton, { backgroundColor: '#FF6B6B' }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: colors.textSecondary }]}>
            AI Recipe App v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
  },
  settingsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  signOutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appInfoText: {
    fontSize: 12,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  subscriptionStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subscriptionDetail: {
    fontSize: 14,
    lineHeight: 20,
  },
  proBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugInfo: {
    padding: 12,
    borderRadius: 8,
  },
  debugText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  usageSection: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  usageRow: {
    gap: 12,
  },
  usageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  usageTextContainer: {
    flex: 1,
  },
  usageLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  usageValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  limitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  limitWarningText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
