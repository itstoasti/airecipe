import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription, FREE_TIER_LIMITS } from '../contexts/SubscriptionContext';

type PaywallScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Paywall'>;

interface Props {
  navigation: PaywallScreenNavigationProp;
}

export default function PaywallScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { offerings, purchasePackage, restorePurchases, isLoading } = useSubscription();
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<'monthly' | 'yearly'>('yearly');

  // Get packages from offerings
  const monthlyPackage = offerings?.availablePackages.find((pkg) =>
    pkg.identifier.includes('monthly')
  );
  const yearlyPackage = offerings?.availablePackages.find((pkg) =>
    pkg.identifier.includes('annual') || pkg.identifier.includes('yearly')
  );

  // Debug logging
  React.useEffect(() => {
    console.log('Paywall: Offerings loaded:', !!offerings);
    console.log('Paywall: Available packages:', offerings?.availablePackages?.length || 0);
    console.log('Paywall: Monthly package found:', !!monthlyPackage);
    console.log('Paywall: Yearly package found:', !!yearlyPackage);
    if (monthlyPackage) {
      console.log('Paywall: Monthly price:', monthlyPackage.product.priceString);
    }
    if (yearlyPackage) {
      console.log('Paywall: Yearly price:', yearlyPackage.product.priceString);
    }
  }, [offerings, monthlyPackage, yearlyPackage]);

  const handlePurchase = async () => {
    if (!offerings || !offerings.availablePackages) {
      Alert.alert('Error', 'No subscription packages available. Please try again later.');
      return;
    }

    setPurchasing(true);
    try {
      const packageToPurchase = offerings.availablePackages.find((pkg) =>
        selectedPackage === 'monthly' ? pkg.identifier.includes('monthly') : pkg.identifier.includes('annual')
      );

      if (packageToPurchase) {
        try {
          await purchasePackage(packageToPurchase);
          // Only show success if purchase actually succeeded
          Alert.alert('Success!', 'Welcome to Yummy Pro! 🎉', [
            { text: 'Get Started', onPress: () => navigation.goBack() },
          ]);
        } catch (purchaseError: any) {
          // Re-throw to be caught by outer catch
          throw purchaseError;
        }
      } else {
        Alert.alert('Error', 'Selected package not found.');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);

      // Handle Test Store specific errors
      if (error.code === '5' || error.message?.includes('Test purchase failure')) {
        Alert.alert(
          'Test Store Mode',
          'You are using RevenueCat Test Store in Expo Go. Purchases are simulated and do NOT grant subscriptions.\n\nGo to your Profile to see your actual subscription status.\n\nTo test real purchases, build a standalone app with EAS Build.',
          [{ text: 'OK' }]
        );
      } else if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message || 'An error occurred during purchase.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      await restorePurchases();
      Alert.alert('Success', 'Your purchases have been restored!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Restore Failed', 'No purchases found to restore.');
    } finally {
      setPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Upgrade to Pro</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroSection}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>
            Unlock the Full Experience
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Get unlimited recipes, no ads, and premium features
          </Text>
        </View>

        <View style={styles.featuresSection}>
          <FeatureItem
            icon="infinite"
            title="Unlimited Recipe Generation"
            description={`Free: ${FREE_TIER_LIMITS.DAILY_RECIPE_GENERATIONS} recipes/day • Pro: Unlimited`}
            colors={colors}
          />
          <FeatureItem
            icon="bookmark"
            title="Save Unlimited Recipes"
            description={`Free: ${FREE_TIER_LIMITS.MAX_SAVED_RECIPES} recipes • Pro: Unlimited`}
            colors={colors}
          />
          <FeatureItem
            icon="eye-off"
            title="Ad-Free Experience"
            description="Enjoy the app without any interruptions"
            colors={colors}
          />
          <FeatureItem
            icon="sparkles"
            title="Priority Support"
            description="Get help faster with priority email support"
            colors={colors}
          />
        </View>

        <View style={styles.plansSection}>
          <Text style={[styles.plansTitle, { color: colors.text }]}>Choose Your Plan</Text>

          <TouchableOpacity
            style={[
              styles.planCard,
              {
                backgroundColor: colors.card,
                borderColor: selectedPackage === 'yearly' ? colors.primary : colors.border,
                borderWidth: selectedPackage === 'yearly' ? 2 : 1,
              },
            ]}
            onPress={() => setSelectedPackage('yearly')}
          >
            {selectedPackage === 'yearly' && (
              <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.popularText}>BEST VALUE</Text>
              </View>
            )}
            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planName, { color: colors.text }]}>Yearly Plan</Text>
                <Text style={[styles.planPrice, { color: colors.text }]}>
                  {yearlyPackage?.product.priceString || '$29.99'}/year
                </Text>
              </View>
              <View style={styles.radioButton}>
                {selectedPackage === 'yearly' && (
                  <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </View>
            {monthlyPackage && yearlyPackage && (
              <Text style={[styles.planSavings, { color: colors.primary }]}>
                Save {Math.round((1 - (yearlyPackage.product.price / 12) / monthlyPackage.product.price) * 100)}% compared to monthly
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.planCard,
              {
                backgroundColor: colors.card,
                borderColor: selectedPackage === 'monthly' ? colors.primary : colors.border,
                borderWidth: selectedPackage === 'monthly' ? 2 : 1,
              },
            ]}
            onPress={() => setSelectedPackage('monthly')}
          >
            <View style={styles.planHeader}>
              <View>
                <Text style={[styles.planName, { color: colors.text }]}>Monthly Plan</Text>
                <Text style={[styles.planPrice, { color: colors.text }]}>
                  {monthlyPackage?.product.priceString || '$4.99'}/month
                </Text>
              </View>
              <View style={styles.radioButton}>
                {selectedPackage === 'monthly' && (
                  <View style={[styles.radioButtonInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.subscribeButton, { backgroundColor: colors.primary }]}
          onPress={handlePurchase}
          disabled={purchasing}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.subscribeButtonText}>Start Free Trial</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={purchasing}>
          <Text style={[styles.restoreButtonText, { color: colors.textSecondary }]}>
            Restore Purchases
          </Text>
        </TouchableOpacity>

        <Text style={[styles.disclaimer, { color: colors.placeholder }]}>
          7-day free trial, then {selectedPackage === 'yearly'
            ? (yearlyPackage?.product.priceString || '$29.99') + '/year'
            : (monthlyPackage?.product.priceString || '$4.99') + '/month'}.
          Cancel anytime.
        </Text>
      </ScrollView>
    </View>
  );
}

function FeatureItem({
  icon,
  title,
  description,
  colors,
}: {
  icon: any;
  title: string;
  description: string;
  colors: any;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: `${colors.primary}15` }]}>
        <Ionicons name={icon} size={24} color={colors.primary} />
      </View>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
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
  content: {
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  featuresSection: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  plansSection: {
    marginBottom: 24,
  },
  plansTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  planCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  planSavings: {
    fontSize: 14,
    fontWeight: '600',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 16,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
