import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getSavedRecipes, deleteRecipe, CATEGORIES } from '../utils/storage';
import { Recipe } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

type SavedRecipesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'SavedRecipes'>,
  StackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: SavedRecipesScreenNavigationProp;
}

export default function SavedRecipesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [calorieInfoVisible, setCalorieInfoVisible] = useState(false);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const loadedRecipes = await getSavedRecipes();
      setAllRecipes(loadedRecipes);
      filterRecipes(loadedRecipes, selectedCategory, searchQuery);
    } catch (error) {
      Alert.alert('Error', 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const filterRecipes = (recipesToFilter: Recipe[], category: string, query: string) => {
    let filtered = recipesToFilter;

    // If there's a search query, search across ALL recipes
    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(lowercaseQuery) ||
          recipe.ingredients.some((ing) => ing.toLowerCase().includes(lowercaseQuery)) ||
          recipe.instructions.some((inst) => inst.toLowerCase().includes(lowercaseQuery))
      );
    } else {
      // Only filter by category when there's no search query
      filtered = filtered.filter((r) => r.category === category);
    }

    setRecipes(filtered);
  };

  useFocusEffect(
    useCallback(() => {
      loadRecipes();
    }, [selectedCategory])
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterRecipes(allRecipes, selectedCategory, query);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    filterRecipes(allRecipes, category, searchQuery);
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    Alert.alert(
      'Delete Recipe',
      `Are you sure you want to delete "${recipe.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecipe(recipe.id);
              loadRecipes();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete recipe');
            }
          },
        },
      ]
    );
  };

  const handleViewRecipe = (recipe: Recipe) => {
    navigation.navigate('ChatToModify', { recipe });
  };

  const handleShoppingList = (recipe: Recipe) => {
    navigation.navigate('ShoppingList', { recipe });
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={[styles.recipeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleViewRecipe(item)}
      activeOpacity={0.7}
    >
      <View style={styles.recipeHeader}>
        <Text style={[styles.recipeTitle, { color: colors.text }]}>{item.title}</Text>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteRecipe(item);
          }}
        >
          <Ionicons name="trash-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.metaContainer}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.estimatedTime}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="restaurant-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>{item.servingSize} servings</Text>
        </View>
        <TouchableOpacity
          style={styles.metaItem}
          onPress={(e) => {
            e.stopPropagation();
            setCalorieInfoVisible(true);
          }}
        >
          <Ionicons name="flame-outline" size={16} color={colors.primary} />
          <Text style={[styles.calorieText, { color: colors.primary }]}>{item.caloriesPerServing} cal</Text>
          <Ionicons name="information-circle-outline" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredients:</Text>
        {item.ingredients.slice(0, 3).map((ingredient, index) => (
          <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
            • {ingredient}
          </Text>
        ))}
        {item.ingredients.length > 3 && (
          <Text style={[styles.moreText, { color: colors.primary }]}>
            +{item.ingredients.length - 3} more
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton, { backgroundColor: colors.teal }]}
          onPress={(e) => {
            e.stopPropagation();
            handleViewRecipe(item);
          }}
        >
          <Ionicons name="eye-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.listButton, { backgroundColor: colors.orange }]}
          onPress={(e) => {
            e.stopPropagation();
            handleShoppingList(item);
          }}
        >
          <Ionicons name="cart-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Shopping List</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const handleAddRecipe = () => {
    navigation.navigate('AddRecipe');
  };

  const handleProfile = () => {
    navigation.navigate('Profile');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Saved Recipes</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.profileButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            onPress={handleProfile}
          >
            <Ionicons name="person" size={20} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddRecipe}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.categoryContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategory === item ? colors.primary : colors.inputBackground,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => handleCategoryChange(item)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: selectedCategory === item ? '#fff' : colors.text }
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
          />
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, {
              backgroundColor: colors.inputBackground,
              color: colors.text
            }]}
            placeholder="Search by title, ingredient, or instruction..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => handleSearch('')}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {recipes.length > 0 ? (
        <FlatList
          data={recipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadRecipes}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={searchQuery.trim() ? "search-outline" : "bookmark-outline"}
            size={80}
            color={colors.border}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery.trim()
              ? `No recipes found matching "${searchQuery}"`
              : `No saved recipes in ${selectedCategory}`
            }
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
            {searchQuery.trim()
              ? 'Try a different search term'
              : 'Save recipes from the Home screen to see them here!'
            }
          </Text>
        </View>
      )}

      <Modal
        visible={calorieInfoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCalorieInfoVisible(false)}
      >
        <TouchableOpacity
          style={styles.infoModalOverlay}
          activeOpacity={1}
          onPress={() => setCalorieInfoVisible(false)}
        >
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle" size={32} color={colors.primary} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>Calorie Information</Text>
            </View>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              The calorie count shown is <Text style={{ fontWeight: '600' }}>per serving</Text> and is an estimation only.
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary, marginTop: 12 }]}>
              Actual calorie content may vary based on:
            </Text>
            <View style={styles.infoBulletList}>
              <Text style={[styles.infoBullet, { color: colors.textSecondary }]}>• Specific brands and products used</Text>
              <Text style={[styles.infoBullet, { color: colors.textSecondary }]}>• Ingredient preparation methods</Text>
              <Text style={[styles.infoBullet, { color: colors.textSecondary }]}>• Cooking techniques and times</Text>
              <Text style={[styles.infoBullet, { color: colors.textSecondary }]}>• Portion size accuracy</Text>
            </View>
            <TouchableOpacity
              style={[styles.infoButton, { backgroundColor: colors.primary }]}
              onPress={() => setCalorieInfoVisible(false)}
            >
              <Text style={styles.infoButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerButtons: {
    position: 'absolute',
    top: 60,
    right: 20,
    flexDirection: 'row',
    gap: 8,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryContainer: {
    paddingLeft: 20,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 40,
    paddingRight: 40,
    paddingVertical: 12,
    borderRadius: 24,
    fontSize: 15,
  },
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  recipeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 4,
    fontSize: 14,
  },
  calorieText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  moreText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  viewButton: {},
  listButton: {},
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoCard: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 15,
    lineHeight: 22,
  },
  infoBulletList: {
    marginTop: 8,
    marginLeft: 8,
  },
  infoBullet: {
    fontSize: 14,
    lineHeight: 24,
  },
  infoButton: {
    marginTop: 20,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
