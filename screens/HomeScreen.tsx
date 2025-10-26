import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Keyboard,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getRecipeSuggestions } from '../utils/openaiService';
import { saveRecipe, CATEGORIES } from '../utils/storage';
import { Recipe } from '../types';
import { getPopularRecipes, saveRecipeToDatabase } from '../utils/recipeDatabase';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

const SERVING_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20];

const LOADING_MESSAGES = [
  'Finding the perfect recipes...',
  'Calculating nutritional values...',
  'Gathering ingredients...',
  'Creating detailed instructions...',
  'Almost ready...',
];

export default function HomeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [servingSize, setServingSize] = useState(2);
  const [servingPickerVisible, setServingPickerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [calorieInfoVisible, setCalorieInfoVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const [isIngredientsMode, setIsIngredientsMode] = useState(false);
  const [ingredientsList, setIngredientsList] = useState<string[]>([]);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);

  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (loading) {
      let messageIndex = 0;
      const interval = setInterval(() => {
        messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
        setLoadingMessage(LOADING_MESSAGES[messageIndex]);
      }, 4000);

      const createPulse = (animValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animValue, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const animations = Animated.parallel([
        createPulse(dot1Anim, 0),
        createPulse(dot2Anim, 200),
        createPulse(dot3Anim, 400),
      ]);

      animations.start();

      return () => {
        clearInterval(interval);
        animations.stop();
      };
    } else {
      dot1Anim.setValue(0);
      dot2Anim.setValue(0);
      dot3Anim.setValue(0);
    }
  }, [loading]);

  const handleSearch = async (searchQuery?: string) => {
    const queryToUse = searchQuery || query;

    if (!queryToUse.trim()) {
      Alert.alert('Error', 'Please enter what you want to eat');
      return;
    }

    setLoading(true);
    setLoadingMessage(LOADING_MESSAGES[0]);
    setLastSearchQuery(queryToUse);
    try {
      const suggestions = await getRecipeSuggestions(queryToUse, servingSize);
      setRecipes(suggestions);

      // Save recipes to database in the background
      suggestions.forEach((recipe) => {
        saveRecipeToDatabase(recipe).catch((err) => {
          console.error('Failed to save recipe to database:', err);
        });
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get recipe suggestions');
    } finally {
      setLoading(false);
    }
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

  const handleChatToModify = (recipe: Recipe) => {
    navigation.navigate('ChatToModify', { recipe });
  };

  const handleQuickAction = async (searchQuery: string) => {
    setQuery(searchQuery);
    handleSearch(searchQuery);
  };

  const handlePopularRecipes = () => {
    navigation.navigate('PopularRecipes');
  };

  const handleAddIngredient = () => {
    if (!query.trim()) return;

    setIngredientsList((prev) => [...prev, query.trim()]);
    setQuery('');
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredientsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIngredientsSearch = async () => {
    if (ingredientsList.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    setLoading(true);
    setLoadingMessage(LOADING_MESSAGES[0]);
    try {
      const ingredientsText = ingredientsList.join(', ');
      const searchQuery = `recipes using only these ingredients: ${ingredientsText}`;
      setLastSearchQuery(searchQuery);
      const suggestions = await getRecipeSuggestions(searchQuery, servingSize);
      setRecipes(suggestions);
      setIngredientsList([]);
      setIsIngredientsMode(false);

      // Save recipes to database in the background
      suggestions.forEach((recipe) => {
        saveRecipeToDatabase(recipe).catch((err) => {
          console.error('Failed to save recipe to database:', err);
        });
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to get recipe suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = async () => {
    if (!lastSearchQuery.trim() || loadingMore) {
      return;
    }

    setLoadingMore(true);
    try {
      const newSuggestions = await getRecipeSuggestions(lastSearchQuery, servingSize);
      setRecipes((prevRecipes) => [...prevRecipes, ...newSuggestions]);

      // Save new recipes to database in the background
      newSuggestions.forEach((recipe) => {
        saveRecipeToDatabase(recipe).catch((err) => {
          console.error('Failed to save recipe to database:', err);
        });
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load more recipes');
    } finally {
      setLoadingMore(false);
    }
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={[styles.recipeCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleChatToModify(item)}
      activeOpacity={0.7}
    >
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.recipeImage}
          resizeMode="cover"
        />
      )}

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

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructions:</Text>
        <Text style={[styles.listItem, { color: colors.textSecondary }]} numberOfLines={2}>
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
          style={[styles.actionButton, styles.chatButton, { backgroundColor: colors.primary }]}
          onPress={(e) => {
            e.stopPropagation();
            handleChatToModify(item);
          }}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Chat to Modify</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => navigation.navigate('Profile')}
      >
        <Ionicons
          name="person"
          size={24}
          color={colors.text}
        />
      </TouchableOpacity>

      {recipes.length === 0 ? (
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeText, { color: colors.text }]}>What should we eat?</Text>

          <TouchableOpacity
            style={styles.servingSizeContainer}
            onPress={() => setServingPickerVisible(true)}
          >
            <Text style={[styles.servingSizeLabel, { color: colors.textSecondary }]}>Servings:</Text>
            <View style={[styles.servingSizeButton, {
              backgroundColor: colors.inputBackground,
              borderColor: colors.border
            }]}>
              <Text style={[styles.servingSizeText, { color: colors.text }]}>{servingSize}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={[styles.quickActionButton, {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border
              }]}
              onPress={handlePopularRecipes}
            >
              <Ionicons name="star-outline" size={24} color={colors.purple} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>Popular</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border
              }]}
              onPress={() => {
                setIsIngredientsMode(true);
                setQuery('');
                setTimeout(() => inputRef.current?.focus(), 100);
              }}
            >
              <Ionicons name="restaurant-outline" size={24} color={colors.teal} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>Ingredients</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border
              }]}
              onPress={() => navigation.navigate('MealPlanning')}
            >
              <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
              <Text style={[styles.quickActionText, { color: colors.text }]}>Meal Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, {
                backgroundColor: colors.inputBackground,
                borderColor: colors.border
              }]}
              onPress={() => navigation.navigate('AddRecipe')}
            >
              <Ionicons name="add-circle-outline" size={24} color={colors.orange} />
              <Text style={[styles.quickActionText, { color: colors.text }]}>Add Recipe</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              setRecipes([]);
              setLastSearchQuery('');
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <FlatList
            data={recipes}
            renderItem={renderRecipeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListFooterComponent={
              <View style={styles.loadMoreContainer}>
                <TouchableOpacity
                  style={[styles.loadMoreButton, { backgroundColor: colors.primary }]}
                  onPress={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={20} color="#fff" />
                      <Text style={styles.loadMoreText}>Load More Recipes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            }
          />
        </>
      )}

      {isIngredientsMode && ingredientsList.length > 0 && (
        <View style={[styles.ingredientsListContainer, {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          bottom: 72
        }]}>
          <ScrollView
            style={styles.ingredientsScrollView}
            contentContainerStyle={styles.ingredientsContainer}
            showsVerticalScrollIndicator={true}
          >
            {ingredientsList.map((ingredient, index) => (
              <View key={index} style={[styles.ingredientChip, { backgroundColor: colors.teal }]}>
                <Text style={styles.ingredientChipText}>{ingredient}</Text>
                <TouchableOpacity onPress={() => handleRemoveIngredient(index)}>
                  <Ionicons name="close-circle" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.searchContainer, {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        bottom: 0,
        paddingBottom: keyboardHeight > 0 ? 8 : 24,
        paddingTop: keyboardHeight > 0 ? 8 : 16,
        paddingHorizontal: 16,
        borderTopWidth: keyboardHeight > 0 ? 0 : 1
      }]}>
        <View style={styles.inputWrapper}>
          {isIngredientsMode && (
            <View style={styles.modeIndicator}>
              <Ionicons name="restaurant" size={14} color={colors.teal} />
            </View>
          )}
          <TextInput
            ref={inputRef}
            style={[styles.input, {
              backgroundColor: colors.inputBackground,
              color: colors.text,
              paddingLeft: isIngredientsMode ? 40 : 16
            }]}
            placeholder={isIngredientsMode ? "Add ingredient..." : "Search for recipes..."}
            placeholderTextColor={colors.placeholder}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={isIngredientsMode ? handleAddIngredient : () => handleSearch()}
            returnKeyType={isIngredientsMode ? "done" : "search"}
          />
          {query.length > 0 && !isIngredientsMode && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setQuery('')}
            >
              <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          {isIngredientsMode && (
            <TouchableOpacity
              style={styles.exitModeButton}
              onPress={() => {
                setIsIngredientsMode(false);
                setQuery('');
                setIngredientsList([]);
              }}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        {isIngredientsMode ? (
          <View style={styles.ingredientsButtons}>
            {query.trim().length > 0 && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: colors.inputBackground, borderColor: colors.teal }]}
                onPress={handleAddIngredient}
              >
                <Ionicons name="add" size={24} color={colors.teal} />
              </TouchableOpacity>
            )}
            {ingredientsList.length > 0 && (
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: colors.teal }]}
                onPress={handleIngredientsSearch}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Ionicons name="search" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.searchButton, { backgroundColor: colors.primary }]}
            onPress={() => handleSearch()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Ionicons name="search" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={servingPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setServingPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Servings</Text>
            <ScrollView style={styles.pickerScroll}>
              {SERVING_OPTIONS.map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[styles.pickerOption, {
                    backgroundColor: servingSize === size ? colors.primary : colors.inputBackground,
                  }]}
                  onPress={() => {
                    setServingSize(size);
                    setServingPickerVisible(false);
                  }}
                >
                  <Text style={[styles.pickerOptionText, {
                    color: servingSize === size ? '#fff' : colors.text,
                    fontWeight: servingSize === size ? '600' : '400'
                  }]}>
                    {size} {size === 1 ? 'serving' : 'servings'}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setServingPickerVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: colors.card }]}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>{loadingMessage}</Text>
            <View style={styles.loadingDots}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    backgroundColor: colors.primary,
                    opacity: dot1Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  }
                ]}
              />
              <Animated.View
                style={[
                  styles.dot,
                  {
                    backgroundColor: colors.primary,
                    opacity: dot2Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  }
                ]}
              />
              <Animated.View
                style={[
                  styles.dot,
                  {
                    backgroundColor: colors.primary,
                    opacity: dot3Anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.3, 1],
                    }),
                  }
                ]}
              />
            </View>
          </View>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  servingSizeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    gap: 12,
  },
  servingSizeLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  servingSizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  servingSizeText: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    width: '100%',
    paddingHorizontal: 20,
  },
  quickActionButton: {
    width: '48%',
    paddingVertical: 20,
    borderRadius: 12,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  searchContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  modeIndicator: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  exitModeButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  ingredientsListContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    maxHeight: 180,
  },
  ingredientsScrollView: {
    maxHeight: 180,
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
  },
  ingredientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  ingredientChipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  ingredientsButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addButton: {
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    padding: 14,
    paddingRight: 40,
    fontSize: 16,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  searchButton: {
    padding: 12,
    borderRadius: 24,
    marginLeft: 10,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
    paddingTop: 110,
    paddingBottom: 100,
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
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    marginLeft: -16,
    marginRight: -16,
    marginTop: -16,
    width: '115%',
  },
  recipeHeader: {
    marginBottom: 8,
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
  chatButton: {},
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
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 16,
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#999',
  },
  pickerModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  pickerScroll: {
    maxHeight: 300,
  },
  pickerOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  pickerOptionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingCard: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successCard: {
    backgroundColor: '#fff',
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
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    gap: 8,
    minWidth: 200,
  },
  loadMoreText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
