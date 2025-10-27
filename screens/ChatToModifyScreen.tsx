import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  Share,
  Animated,
  Keyboard,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Recipe, Message } from '../types';
import { chatWithChef } from '../utils/edgeFunctionService';
import { saveRecipe, updateRecipe, CATEGORIES, saveChatMessages, getChatMessages } from '../utils/storage';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

type ChatToModifyScreenRouteProp = RouteProp<RootStackParamList, 'ChatToModify'>;
type ChatToModifyScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ChatToModify'
>;

interface Props {
  route: ChatToModifyScreenRouteProp;
  navigation: ChatToModifyScreenNavigationProp;
}

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -8,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = animate(dot1, 0);
    const animation2 = animate(dot2, 200);
    const animation3 = animate(dot3, 400);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, []);

  return (
    <View style={styles.typingDots}>
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]} />
    </View>
  );
}

export default function ChatToModifyScreen({ route, navigation }: Props) {
  const { colors } = useTheme();
  const { session } = useAuth();
  const { isPro } = useSubscription();
  const { recipe: initialRecipe } = route.params;
  const [recipe, setRecipe] = useState<Recipe>(initialRecipe);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecipe, setShowRecipe] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [calorieInfoVisible, setCalorieInfoVisible] = useState(false);
  const [saveCategoryModalVisible, setSaveCategoryModalVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  // Load saved chat messages when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      const savedMessages = await getChatMessages(recipe.id);
      if (savedMessages.length > 0) {
        setMessages(savedMessages);
        setShowChat(true);
      }
    };
    loadMessages();
  }, [recipe.id]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = { role: 'user', content: inputText };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setLoading(true);

    try {
      if (!session?.access_token) {
        throw new Error('You must be logged in to chat with the chef');
      }
      const { response, updatedRecipe } = await chatWithChef(
        recipe,
        messages,
        inputText,
        session.access_token
      );

      const assistantMessage: Message = { role: 'assistant', content: response };
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      setRecipe(updatedRecipe);

      // Save chat messages to storage
      await saveChatMessages(recipe.id, finalMessages);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to chat with chef');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async () => {
    try {
      if (recipe.category) {
        // Update existing recipe (no limit check needed for updates)
        await updateRecipe(recipe);
        setSuccessMessage('Recipe updated successfully!');
        setSuccessVisible(true);
        setTimeout(() => setSuccessVisible(false), 2000);
      } else {
        // Save new recipe - show modal
        setSaveCategoryModalVisible(true);
      }
    } catch (error: any) {
      if (error.message?.includes('Free tier limit')) {
        Alert.alert(
          'Storage Limit Reached',
          'You\'ve saved 10 recipes (free limit). Upgrade to Pro for unlimited storage or delete some recipes.',
          [
            { text: 'Delete Recipes', onPress: () => navigation.navigate('AllRecipes') },
            { text: 'Upgrade to Pro', onPress: () => navigation.navigate('Paywall') }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to save recipe');
      }
    }
  };

  const saveRecipeWithCategory = async (category: string) => {
    try {
      const recipeToSave = { ...recipe, category };
      await saveRecipe(recipeToSave, isPro);
      setSaveCategoryModalVisible(false);
      setSuccessMessage(`Recipe saved to ${category}!`);
      setSuccessVisible(true);
      setTimeout(() => setSuccessVisible(false), 2000);
    } catch (error: any) {
      setSaveCategoryModalVisible(false);
      if (error.message?.includes('Free tier limit')) {
        Alert.alert(
          'Storage Limit Reached',
          'You\'ve saved 10 recipes (free limit). Upgrade to Pro for unlimited storage or delete some recipes.',
          [
            { text: 'Delete Recipes', onPress: () => navigation.navigate('AllRecipes') },
            { text: 'Upgrade to Pro', onPress: () => navigation.navigate('Paywall') }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to save recipe');
      }
    }
  };

  const handleShareRecipe = async () => {
    try {
      const ingredientsList = recipe.ingredients.map((ing, idx) => `${idx + 1}. ${ing}`).join('\n');
      const instructionsList = recipe.instructions.map((inst, idx) => `${idx + 1}. ${inst}`).join('\n');

      const message = `${recipe.title}\n\n` +
        `⏱ Time: ${recipe.estimatedTime}\n` +
        `🍽 Servings: ${recipe.servingSize}\n` +
        `🔥 Calories: ${recipe.caloriesPerServing} per serving\n\n` +
        `📝 Ingredients:\n${ingredientsList}\n\n` +
        `👨‍🍳 Instructions:\n${instructionsList}\n\n` +
        `Shared from AI Recipe App`;

      await Share.share({
        message: message,
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to share recipe');
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => (
    <View
      style={[
        styles.messageBubble,
        item.role === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.content}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => {
          if (showChat) {
            setShowChat(false);
          } else {
            navigation.goBack();
          }
        }}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chef's Assistant</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleShareRecipe} style={styles.headerButton}>
            <Ionicons name="share-social-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowRecipe(!showRecipe)} style={styles.headerButton}>
            <Ionicons
              name={showRecipe ? 'eye-off-outline' : 'eye-outline'}
              size={24}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {!showChat ? (
          <ScrollView style={[styles.recipeScrollView, { backgroundColor: colors.card }]} contentContainerStyle={styles.recipeContent}>
          {showRecipe && (
            <>
              {recipe.imageUrl && (
                <Image
                  source={{ uri: recipe.imageUrl }}
                  style={styles.recipeImage}
                  resizeMode="cover"
                />
              )}

              <Text style={[styles.recipeTitle, { color: colors.text }]}>{recipe.title}</Text>

              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{recipe.estimatedTime}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="restaurant-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>{recipe.servingSize} servings</Text>
                </View>
                <TouchableOpacity
                  style={styles.metaItem}
                  onPress={() => setCalorieInfoVisible(true)}
                >
                  <Ionicons name="flame-outline" size={16} color={colors.primary} />
                  <Text style={[styles.calorieText, { color: colors.primary }]}>{recipe.caloriesPerServing} cal</Text>
                  <Ionicons name="information-circle-outline" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Ingredients:</Text>
                {recipe.ingredients.map((ingredient, index) => (
                  <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
                    • {ingredient}
                  </Text>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Instructions:</Text>
                {recipe.instructions.map((instruction, index) => (
                  <Text key={index} style={[styles.listItem, { color: colors.textSecondary }]}>
                    {index + 1}. {instruction}
                  </Text>
                ))}
              </View>

              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.teal }]} onPress={handleSaveRecipe}>
                <Ionicons name="bookmark" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>
                  {recipe.category ? 'Update Recipe' : 'Save Recipe'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      ) : (
        <View style={styles.chatContainer}>
          {messages.length === 0 ? (
            <View style={styles.emptyChat}>
              <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
              <Text style={styles.emptyChatText}>
                Ask the chef to modify the recipe!
              </Text>
              <Text style={styles.emptyChatSubtext}>
                Try: "Make it vegan" or "Reduce calories"
              </Text>
            </View>
          ) : (
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.messageList}
              ListFooterComponent={
                loading ? (
                  <View style={styles.typingIndicatorContainer}>
                    <View style={[styles.typingBubble, { backgroundColor: colors.inputBackground }]}>
                      <TypingIndicator />
                    </View>
                  </View>
                ) : null
              }
            />
          )}
        </View>
      )}

        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text }]}
            placeholder="Ask the chef..."
            placeholderTextColor={colors.placeholder}
            value={inputText}
            onChangeText={setInputText}
            onFocus={() => setShowChat(true)}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }, loading && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={loading || !inputText.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

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

      <Modal
        visible={saveCategoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSaveCategoryModalVisible(false)}
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
              onPress={() => setSaveCategoryModalVisible(false)}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  recipeScrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  recipeContent: {
    padding: 16,
    paddingBottom: 80,
  },
  chatWrapper: {
    flex: 1,
  },
  recipeImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 4,
    color: '#666',
    fontSize: 14,
  },
  calorieText: {
    marginLeft: 4,
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  listItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  chatContainer: {
    flex: 1,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyChatText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  messageList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF6B6B',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: '#FF6B6B',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
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
    fontSize: 14,
    textAlign: 'center',
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
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoBulletList: {
    marginTop: 8,
    marginBottom: 20,
  },
  infoBullet: {
    fontSize: 14,
    lineHeight: 22,
    marginLeft: 8,
  },
  infoButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  infoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  typingIndicatorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  typingBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    minWidth: 60,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
  },
});
