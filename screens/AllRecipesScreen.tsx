import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, MainTabParamList, Recipe } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { getAllRecipes, incrementRecipeViewCount } from '../utils/recipeDatabase';
import { saveRecipe, CATEGORIES } from '../utils/storage';
import { useFocusEffect } from '@react-navigation/native';

type AllRecipesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Recipes'>,
  StackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: AllRecipesScreenNavigationProp;
}

type SortOption = 'random' | 'newest' | 'popular' | 'alphabetical';

export default function AllRecipesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('random');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      resetAndLoad();
    }, [])
  );

  const resetAndLoad = () => {
    setRecipes([]);
    setPage(0);
    setHasMore(true);
    loadRecipes(0, sortBy, searchQuery);
  };

  const loadRecipes = async (pageNum: number, sort: SortOption, search: string) => {
    if (pageNum === 0) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const newRecipes = await getAllRecipes(pageNum, 10, search || undefined, sort);

      if (newRecipes.length < 10) {
        setHasMore(false);
      }

      if (pageNum === 0) {
        setRecipes(newRecipes);
        if (newRecipes.length === 0) {
          Alert.alert(
            'No Recipes Yet',
            'There are no recipes in the database yet. Generate recipes or add your own to build the collection!'
          );
        }
      } else {
        setRecipes((prev) => [...prev, ...newRecipes]);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setRecipes([]);
    setPage(0);
    setHasMore(true);
    loadRecipes(0, sortBy, query);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setSortModalVisible(false);
    setRecipes([]);
    setPage(0);
    setHasMore(true);
    loadRecipes(0, newSort, searchQuery);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && recipes.length > 0) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadRecipes(nextPage, sortBy, searchQuery);
    }
  };

  const handleViewRecipe = (recipe: Recipe) => {
    incrementRecipeViewCount(recipe.id);
    navigation.navigate('ChatToModify', { recipe });
  };

  const handleSaveRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setModalVisible(true);
  };

  const saveRecipeWithCategory = async (category: string) => {
    if (!selectedRecipe) return;

    try {
      const recipeToSave = { ...selectedRecipe, category };
      await saveRecipe(recipeToSave);
      setModalVisible(false);
      setSuccessMessage(`Recipe saved to ${category}!`);
      setSuccessVisible(true);
      setTimeout(() => setSuccessVisible(false), 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to save recipe');
    }
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
        <View style={styles.metaItem}>
          <Ionicons name="flame-outline" size={16} color={colors.primary} />
          <Text style={[styles.calorieText, { color: colors.primary }]}>{item.caloriesPerServing} cal</Text>
        </View>
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
          style={[styles.actionButton, styles.saveButton, { backgroundColor: colors.teal }]}
          onPress={(e) => {
            e.stopPropagation();
            handleSaveRecipe(item);
          }}
        >
          <Ionicons name="bookmark-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Save</Text>
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>All Recipes</Text>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
            onPress={() => setSortModalVisible(true)}
          >
            <Ionicons name="funnel-outline" size={18} color={colors.text} />
            <Text style={[styles.sortButtonText, { color: colors.text }]}>
              {sortBy === 'random' ? 'Random' : sortBy === 'newest' ? 'Newest' : sortBy === 'popular' ? 'Popular' : 'A-Z'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, {
                backgroundColor: colors.inputBackground,
                color: colors.text
              }]}
              placeholder="Search recipes..."
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
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading recipes...
          </Text>
        </View>
      ) : recipes.length > 0 ? (
        <FlatList
          data={recipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={resetAndLoad}
          ListFooterComponent={
            hasMore && recipes.length > 0 ? (
              <View style={styles.loadMoreContainer}>
                <TouchableOpacity
                  style={[styles.loadMoreButton, { backgroundColor: colors.primary }]}
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                      <Text style={styles.loadMoreText}>Loading...</Text>
                    </>
                  ) : (
                    <Text style={styles.loadMoreText}>Load More</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : !hasMore && recipes.length > 0 ? (
              <View style={styles.loadMoreContainer}>
                <Text style={[styles.noMoreText, { color: colors.textSecondary }]}>
                  No more recipes
                </Text>
              </View>
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons
            name={searchQuery.trim() ? "search-outline" : "restaurant-outline"}
            size={80}
            color={colors.border}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {searchQuery.trim()
              ? `No recipes found matching "${searchQuery}"`
              : 'No recipes in the database yet'
            }
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.placeholder }]}>
            {searchQuery.trim()
              ? 'Try a different search term'
              : 'Generate recipes or add your own to see them here!'
            }
          </Text>
        </View>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Save to Category</Text>

            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.categoryButton, { backgroundColor: colors.inputBackground }]}
                onPress={() => saveRecipeWithCategory(category)}
              >
                <Text style={[styles.categoryButtonText, { color: colors.text }]}>{category}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={sortModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Sort By</Text>

            <TouchableOpacity
              style={[styles.categoryButton, {
                backgroundColor: sortBy === 'random' ? colors.primary : colors.inputBackground
              }]}
              onPress={() => handleSortChange('random')}
            >
              <Ionicons
                name="shuffle-outline"
                size={20}
                color={sortBy === 'random' ? '#fff' : colors.text}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.categoryButtonText, {
                color: sortBy === 'random' ? '#fff' : colors.text
              }]}>Random</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryButton, {
                backgroundColor: sortBy === 'newest' ? colors.primary : colors.inputBackground
              }]}
              onPress={() => handleSortChange('newest')}
            >
              <Ionicons
                name="time-outline"
                size={20}
                color={sortBy === 'newest' ? '#fff' : colors.text}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.categoryButtonText, {
                color: sortBy === 'newest' ? '#fff' : colors.text
              }]}>Newest First</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryButton, {
                backgroundColor: sortBy === 'popular' ? colors.primary : colors.inputBackground
              }]}
              onPress={() => handleSortChange('popular')}
            >
              <Ionicons
                name="flame-outline"
                size={20}
                color={sortBy === 'popular' ? '#fff' : colors.text}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.categoryButtonText, {
                color: sortBy === 'popular' ? '#fff' : colors.text
              }]}>Most Popular</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.categoryButton, {
                backgroundColor: sortBy === 'alphabetical' ? colors.primary : colors.inputBackground
              }]}
              onPress={() => handleSortChange('alphabetical')}
            >
              <Ionicons
                name="text-outline"
                size={20}
                color={sortBy === 'alphabetical' ? '#fff' : colors.text}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.categoryButtonText, {
                color: sortBy === 'alphabetical' ? '#fff' : colors.text
              }]}>Alphabetical (A-Z)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSortModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={successVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessVisible(false)}
      >
        <View style={styles.successOverlay}>
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark-circle" size={48} color={colors.teal} />
            <Text style={[styles.successText, { color: colors.text }]}>{successMessage}</Text>
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
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
    marginBottom: 12,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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
  saveButton: {},
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  categoryButton: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    padding: 16,
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    textAlign: 'center',
  },
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadMoreContainer: {
    padding: 12,
    paddingBottom: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  noMoreText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
