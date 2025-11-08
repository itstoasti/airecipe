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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Recipe } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { getSavedRecipes } from '../utils/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAllRecipes } from '../utils/recipeDatabase';

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
    snacks?: Recipe;
    drinks?: Recipe;
    dessert?: Recipe;
  };
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TIMES = ['breakfast', 'lunch', 'dinner', 'snacks', 'drinks', 'dessert'] as const;
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
  const [manualEntryVisible, setManualEntryVisible] = useState(false);
  const [manualMealName, setManualMealName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [databaseRecipes, setDatabaseRecipes] = useState<Recipe[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDatabaseRecipes, setShowDatabaseRecipes] = useState(false);

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
    setSearchQuery('');
    setDatabaseRecipes([]);
    setShowDatabaseRecipes(false);
    setModalVisible(true);
  };

  const handleSearchDatabase = async () => {
    if (!searchQuery.trim()) {
      Alert.alert('Error', 'Please enter a search term');
      return;
    }

    setSearchLoading(true);
    setShowDatabaseRecipes(true);
    try {
      const results = await getAllRecipes(0, 20, searchQuery.trim(), 'random');
      setDatabaseRecipes(results);
      if (results.length === 0) {
        Alert.alert('No Results', 'No recipes found matching your search');
      }
    } catch (error) {
      console.error('Error searching recipes:', error);
      Alert.alert('Error', 'Failed to search recipes');
    } finally {
      setSearchLoading(false);
    }
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

  const handleManualEntry = () => {
    setModalVisible(false);
    setManualMealName('');
    setManualEntryVisible(true);
  };

  const handleSaveManualMeal = () => {
    if (!manualMealName.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    // Create a simple recipe object for manual entry
    const manualRecipe: Recipe = {
      id: `manual-${Date.now()}`,
      title: manualMealName.trim(),
      ingredients: [],
      instructions: [],
      estimatedTime: '',
      servingSize: 1,
      caloriesPerServing: 0,
    };

    const updatedPlan = { ...mealPlan };
    if (!updatedPlan[selectedDay]) {
      updatedPlan[selectedDay] = {};
    }
    updatedPlan[selectedDay][selectedMealTime] = manualRecipe;
    saveMealPlan(updatedPlan);
    setManualEntryVisible(false);
    setManualMealName('');
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
      case 'snacks':
        return 'fast-food-outline';
      case 'drinks':
        return 'cafe-outline';
      case 'dessert':
        return 'ice-cream-outline';
    }
  };

  const handleDayShoppingList = (day: string) => {
    const dayMeals = mealPlan[day];
    if (!dayMeals) {
      Alert.alert('No Meals', 'Add meals to this day first to generate a shopping list.');
      return;
    }

    // Collect all meals for the day
    const meals: Recipe[] = [];
    if (dayMeals.breakfast) meals.push(dayMeals.breakfast);
    if (dayMeals.lunch) meals.push(dayMeals.lunch);
    if (dayMeals.dinner) meals.push(dayMeals.dinner);
    if (dayMeals.snacks) meals.push(dayMeals.snacks);
    if (dayMeals.drinks) meals.push(dayMeals.drinks);
    if (dayMeals.dessert) meals.push(dayMeals.dessert);

    if (meals.length === 0) {
      Alert.alert('No Meals', 'Add meals to this day first to generate a shopping list.');
      return;
    }

    // Filter out manual entries (recipes with no ingredients)
    const recipesWithIngredients = meals.filter(meal => meal.ingredients && meal.ingredients.length > 0);

    if (recipesWithIngredients.length === 0) {
      Alert.alert('No Ingredients', 'The meals for this day don\'t have ingredient lists. Try adding recipes from the database or your saved recipes.');
      return;
    }

    // Create a combined recipe for the day
    const dayRecipe: Recipe = {
      id: `day-${day}-${Date.now()}`,
      title: `${day}'s Meal Plan`,
      ingredients: recipesWithIngredients.flatMap(meal => meal.ingredients),
      instructions: [],
      estimatedTime: '',
      servingSize: 1,
      caloriesPerServing: recipesWithIngredients.reduce((sum, meal) => sum + meal.caloriesPerServing, 0),
    };

    navigation.navigate('ShoppingList', { recipe: dayRecipe });
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
              <View style={styles.dayHeader}>
                <Text style={[styles.dayTitle, { color: colors.text }]}>{day}</Text>
                <TouchableOpacity
                  style={[styles.shoppingListButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleDayShoppingList(day)}
                >
                  <Ionicons name="cart-outline" size={16} color="#fff" />
                  <Text style={styles.shoppingListButtonText}>Shopping List</Text>
                </TouchableOpacity>
              </View>
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

            <TouchableOpacity
              style={[styles.manualEntryButton, { backgroundColor: colors.primary }]}
              onPress={handleManualEntry}
            >
              <Ionicons name="create-outline" size={20} color="#fff" />
              <Text style={styles.manualEntryButtonText}>Manual Entry</Text>
            </TouchableOpacity>

            <View style={[styles.searchContainer, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search database recipes..."
                placeholderTextColor={colors.placeholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={handleSearchDatabase}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => {
                  setSearchQuery('');
                  setDatabaseRecipes([]);
                  setShowDatabaseRecipes(false);
                }}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: colors.teal }]}
              onPress={handleSearchDatabase}
              disabled={searchLoading || !searchQuery.trim()}
            >
              {searchLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="search-outline" size={20} color="#fff" />
                  <Text style={styles.searchButtonText}>Search Database</Text>
                </>
              )}
            </TouchableOpacity>

            {showDatabaseRecipes && databaseRecipes.length > 0 && (
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                Database Results ({databaseRecipes.length})
              </Text>
            )}

            {!showDatabaseRecipes && (
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                Your Saved Recipes
              </Text>
            )}

            <ScrollView style={styles.recipeList}>
              {(showDatabaseRecipes ? databaseRecipes : savedRecipes).map((recipe) => (
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

      <Modal
        visible={manualEntryVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setManualEntryVisible(false)}
      >
        <View style={styles.manualModalOverlay}>
          <View style={[styles.manualModalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.manualModalTitle, { color: colors.text }]}>
              Enter Meal Name
            </Text>
            <Text style={[styles.manualModalSubtitle, { color: colors.textSecondary }]}>
              {selectedDay} - {selectedMealTime.charAt(0).toUpperCase() + selectedMealTime.slice(1)}
            </Text>

            <TextInput
              style={[styles.manualInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., Pizza from Tony's, Leftover pasta"
              placeholderTextColor={colors.placeholder}
              value={manualMealName}
              onChangeText={setManualMealName}
              autoFocus
              maxLength={100}
            />

            <View style={styles.manualModalButtons}>
              <TouchableOpacity
                style={[styles.manualCancelButton, { borderColor: colors.border }]}
                onPress={() => {
                  setManualEntryVisible(false);
                  setManualMealName('');
                }}
              >
                <Text style={[styles.manualCancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.manualSaveButton, { backgroundColor: colors.primary }]}
                onPress={handleSaveManualMeal}
              >
                <Text style={styles.manualSaveButtonText}>Add Meal</Text>
              </TouchableOpacity>
            </View>
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
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  shoppingListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  shoppingListButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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
  manualEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderRadius: 8,
  },
  manualEntryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 14,
    borderRadius: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  manualModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  manualModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  manualModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  manualModalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  manualInput: {
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  manualModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  manualCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  manualCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  manualSaveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  manualSaveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
