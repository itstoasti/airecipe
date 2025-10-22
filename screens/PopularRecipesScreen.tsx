import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Recipe } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { getPopularRecipes, incrementRecipeViewCount } from '../utils/recipeDatabase';
import { saveRecipe, CATEGORIES } from '../utils/storage';

type PopularRecipesScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PopularRecipes'
>;

interface Props {
  navigation: PopularRecipesScreenNavigationProp;
}

export default function PopularRecipesScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPopularRecipes();
  }, []);

  const loadPopularRecipes = async () => {
    setLoading(true);
    try {
      const popularRecipes = await getPopularRecipes(20); // Get top 20
      setRecipes(popularRecipes);

      if (popularRecipes.length === 0) {
        Alert.alert(
          'No Popular Recipes Yet',
          'There are no popular recipes yet. Start creating and sharing recipes to build the community collection!'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load popular recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecipe = (recipe: Recipe) => {
    // Increment view count
    incrementRecipeViewCount(recipe.id);
    navigation.navigate('ChatToModify', { recipe });
  };

  const handleSaveRecipe = (recipe: Recipe) => {
    Alert.alert(
      'Save Recipe',
      'Choose a category:',
      CATEGORIES.map((category) => ({
        text: category,
        onPress: async () => {
          try {
            const recipeToSave = { ...recipe, category };
            await saveRecipe(recipeToSave);
            Alert.alert('Success', `Recipe saved to ${category}!`);
          } catch (error) {
            Alert.alert('Error', 'Failed to save recipe');
          }
        },
      }))
    );
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

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructions:</Text>
        <Text style={[styles.listItem, { color: colors.textSecondary }]}>
          {item.instructions[0]}
        </Text>
        {item.instructions.length > 1 && (
          <Text style={[styles.moreText, { color: colors.primary }]}>
            +{item.instructions.length - 1} more steps
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.teal }]}
          onPress={(e) => {
            e.stopPropagation();
            handleSaveRecipe(item);
          }}
        >
          <Ionicons name="bookmark-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Save</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.orange }]}
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Popular Recipes</Text>
        <TouchableOpacity onPress={loadPopularRecipes}>
          <Ionicons name="refresh" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading popular recipes...
          </Text>
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={80} color={colors.border} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No Popular Recipes Yet
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Start creating and sharing recipes to build the community collection!
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={loadPopularRecipes}
        />
      )}
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
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
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
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
