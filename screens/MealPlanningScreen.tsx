import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Recipe } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { getSavedRecipes } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

type MealPlanningScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'MealPlanning'
>;

interface Props {
  navigation: MealPlanningScreenNavigationProp;
}

interface MealPlan {
  [key: string]: {
    breakfast?: Recipe;
    lunch?: Recipe;
    dinner?: Recipe;
  };
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TIMES = ['breakfast', 'lunch', 'dinner'] as const;
type MealTime = typeof MEAL_TIMES[number];

const MEAL_PLAN_STORAGE_KEY = 'meal_plan';

export default function MealPlanningScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [mealPlan, setMealPlan] = useState<MealPlan>({});
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('breakfast');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load saved recipes
      const recipes = await getSavedRecipes();
      setSavedRecipes(recipes);

      // Load meal plan from storage
      const savedPlan = await AsyncStorage.getItem(MEAL_PLAN_STORAGE_KEY);
      if (savedPlan) {
        setMealPlan(JSON.parse(savedPlan));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMealPlan = async (plan: MealPlan) => {
    try {
      await AsyncStorage.setItem(MEAL_PLAN_STORAGE_KEY, JSON.stringify(plan));
      setMealPlan(plan);
    } catch (error) {
      console.error('Error saving meal plan:', error);
      Alert.alert('Error', 'Failed to save meal plan');
    }
  };

  const handleAddMeal = (day: string, mealTime: MealTime) => {
    setSelectedDay(day);
    setSelectedMealTime(mealTime);
    setModalVisible(true);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    const updatedPlan = { ...mealPlan };
    if (!updatedPlan[selectedDay]) {
      updatedPlan[selectedDay] = {};
    }
    updatedPlan[selectedDay][selectedMealTime] = recipe;
    saveMealPlan(updatedPlan);
    setModalVisible(false);
  };

  const handleRemoveMeal = (day: string, mealTime: MealTime) => {
    Alert.alert(
      'Remove Meal',
      'Are you sure you want to remove this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updatedPlan = { ...mealPlan };
            if (updatedPlan[day]) {
              delete updatedPlan[day][mealTime];
              if (Object.keys(updatedPlan[day]).length === 0) {
                delete updatedPlan[day];
              }
            }
            saveMealPlan(updatedPlan);
          },
        },
      ]
    );
  };

  const handleClearPlan = () => {
    Alert.alert(
      'Clear Meal Plan',
      'Are you sure you want to clear the entire meal plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => saveMealPlan({}),
        },
      ]
    );
  };

  const getMealIcon = (mealTime: MealTime) => {
    switch (mealTime) {
      case 'breakfast':
        return 'sunny-outline';
      case 'lunch':
        return 'partly-sunny-outline';
      case 'dinner':
        return 'moon-outline';
    }
  };

  const renderMealCard = (day: string, mealTime: MealTime) => {
    const meal = mealPlan[day]?.[mealTime];

    if (meal) {
      return (
        <TouchableOpacity
          key={mealTime}
          style={[styles.mealCard, styles.filledMealCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.navigate('ChatToModify', { recipe: meal })}
        >
          <View style={styles.mealCardHeader}>
            <View style={styles.mealTypeContainer}>
              <Ionicons name={getMealIcon(mealTime)} size={16} color={colors.textSecondary} />
              <Text style={[styles.mealType, { color: colors.textSecondary }]}>
                {mealTime.charAt(0).toUpperCase() + mealTime.slice(1)}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleRemoveMeal(day, mealTime)}>
              <Ionicons name="close-circle" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.mealTitle, { color: colors.text }]} numberOfLines={2}>
            {meal.title}
          </Text>
          <View style={styles.mealMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>{meal.estimatedTime}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="flame-outline" size={12} color={colors.primary} />
              <Text style={[styles.metaText, { color: colors.primary }]}>{meal.caloriesPerServing} cal</Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        key={mealTime}
        style={[styles.mealCard, styles.emptyMealCard, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
        onPress={() => handleAddMeal(day, mealTime)}
      >
        <Ionicons name={getMealIcon(mealTime)} size={24} color={colors.textSecondary} />
        <Text style={[styles.emptyMealText, { color: colors.textSecondary }]}>
          {mealTime.charAt(0).toUpperCase() + mealTime.slice(1)}
        </Text>
        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Meal Planning</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Meal Planning</Text>
        <TouchableOpacity onPress={handleClearPlan}>
          <Ionicons name="trash-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {savedRecipes.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="calendar-outline" size={80} color={colors.border} />
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              No Saved Recipes
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
              Save some recipes first to start planning your meals!
            </Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <Text style={styles.emptyStateButtonText}>Browse Recipes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          DAYS_OF_WEEK.map((day) => (
            <View key={day} style={[styles.dayCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.dayTitle, { color: colors.text }]}>{day}</Text>
              <View style={styles.mealsContainer}>
                {MEAL_TIMES.map((mealTime) => renderMealCard(day, mealTime))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Select Recipe for {selectedMealTime.charAt(0).toUpperCase() + selectedMealTime.slice(1)}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.recipeList}>
              {savedRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={[styles.recipeItem, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                  onPress={() => handleSelectRecipe(recipe)}
                >
                  <View style={styles.recipeItemContent}>
                    <Text style={[styles.recipeItemTitle, { color: colors.text }]}>{recipe.title}</Text>
                    <View style={styles.recipeItemMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                        <Text style={[styles.metaText, { color: colors.textSecondary }]}>{recipe.estimatedTime}</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <Ionicons name="flame-outline" size={14} color={colors.primary} />
                        <Text style={[styles.metaText, { color: colors.primary }]}>{recipe.caloriesPerServing} cal</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  dayCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  mealsContainer: {
    gap: 8,
  },
  mealCard: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  filledMealCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyMealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderStyle: 'dashed',
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mealType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  mealMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  emptyMealText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  emptyStateButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  recipeList: {
    maxHeight: 500,
  },
  recipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  recipeItemContent: {
    flex: 1,
  },
  recipeItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  recipeItemMeta: {
    flexDirection: 'row',
    gap: 12,
  },
});
