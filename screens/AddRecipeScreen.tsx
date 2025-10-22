import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, Recipe } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { saveRecipe, CATEGORIES } from '../utils/storage';
import { saveRecipeToDatabase } from '../utils/recipeDatabase';

type AddRecipeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'AddRecipe'
>;

interface Props {
  navigation: AddRecipeScreenNavigationProp;
}

export default function AddRecipeScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [instructionInput, setInstructionInput] = useState('');
  const [instructions, setInstructions] = useState<string[]>([]);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [caloriesPerServing, setCaloriesPerServing] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [submitToDatabase, setSubmitToDatabase] = useState(false);

  const handleAddIngredient = () => {
    if (!ingredientInput.trim()) {
      Alert.alert('Error', 'Please enter an ingredient');
      return;
    }
    setIngredients([...ingredients, ingredientInput.trim()]);
    setIngredientInput('');
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleAddInstruction = () => {
    if (!instructionInput.trim()) {
      Alert.alert('Error', 'Please enter an instruction');
      return;
    }
    setInstructions([...instructions, instructionInput.trim()]);
    setInstructionInput('');
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a recipe title');
      return false;
    }
    if (ingredients.length === 0) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return false;
    }
    if (instructions.length === 0) {
      Alert.alert('Error', 'Please add at least one instruction');
      return false;
    }
    if (!estimatedTime.trim()) {
      Alert.alert('Error', 'Please enter estimated time');
      return false;
    }
    if (!servingSize.trim() || isNaN(parseInt(servingSize))) {
      Alert.alert('Error', 'Please enter a valid serving size');
      return false;
    }
    if (!caloriesPerServing.trim() || isNaN(parseInt(caloriesPerServing))) {
      Alert.alert('Error', 'Please enter valid calories per serving');
      return false;
    }
    return true;
  };

  const handleSaveRecipe = () => {
    if (!validateForm()) return;
    setModalVisible(true);
  };

  const saveRecipeWithCategory = async (category: string) => {
    try {
      const recipe: Recipe = {
        id: `manual-${Date.now()}`,
        title: title.trim(),
        ingredients,
        instructions,
        estimatedTime: estimatedTime.trim(),
        servingSize: parseInt(servingSize),
        caloriesPerServing: parseInt(caloriesPerServing),
        category,
      };

      // Save to personal recipes
      await saveRecipe(recipe);

      // If checkbox is checked, also submit to database
      if (submitToDatabase) {
        try {
          await saveRecipeToDatabase(recipe);
          setSuccessMessage(`Recipe saved to ${category} and submitted to Popular Recipes!`);
        } catch (dbError) {
          console.error('Failed to save to database:', dbError);
          setSuccessMessage(`Recipe saved to ${category}! (Database submission failed)`);
        }
      } else {
        setSuccessMessage(`Recipe saved to ${category}!`);
      }

      setModalVisible(false);
      setSuccessVisible(true);

      // Reset form after 2 seconds
      setTimeout(() => {
        setSuccessVisible(false);
        navigation.goBack();
      }, 2000);
    } catch (error) {
      Alert.alert('Error', 'Failed to save recipe');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Add Recipe</Text>
        <TouchableOpacity onPress={handleSaveRecipe}>
          <Ionicons name="checkmark" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Recipe Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g., Classic Spaghetti Carbonara"
            placeholderTextColor={colors.placeholder}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Ingredients *</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.inputFlex, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., 2 cups flour"
              placeholderTextColor={colors.placeholder}
              value={ingredientInput}
              onChangeText={setIngredientInput}
              onSubmitEditing={handleAddIngredient}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddIngredient}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {ingredients.map((ingredient, index) => (
            <View key={index} style={[styles.listItem, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Text style={[styles.listItemText, { color: colors.text }]}>• {ingredient}</Text>
              <TouchableOpacity onPress={() => handleRemoveIngredient(index)}>
                <Ionicons name="close-circle" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Instructions *</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.inputFlex, styles.textArea, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter instruction step..."
              placeholderTextColor={colors.placeholder}
              value={instructionInput}
              onChangeText={setInstructionInput}
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddInstruction}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          {instructions.map((instruction, index) => (
            <View key={index} style={[styles.listItem, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Text style={[styles.listItemText, { color: colors.text }]}>{index + 1}. {instruction}</Text>
              <TouchableOpacity onPress={() => handleRemoveInstruction(index)}>
                <Ionicons name="close-circle" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.row}>
          <View style={[styles.halfSection, { marginRight: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Estimated Time *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., 30 mins"
              placeholderTextColor={colors.placeholder}
              value={estimatedTime}
              onChangeText={setEstimatedTime}
            />
          </View>
          <View style={[styles.halfSection, { marginLeft: 8 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Servings *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., 4"
              placeholderTextColor={colors.placeholder}
              value={servingSize}
              onChangeText={setServingSize}
              keyboardType="number-pad"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Calories per Serving *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g., 350"
            placeholderTextColor={colors.placeholder}
            value={caloriesPerServing}
            onChangeText={setCaloriesPerServing}
            keyboardType="number-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.checkboxContainer, { borderColor: colors.border }]}
          onPress={() => setSubmitToDatabase(!submitToDatabase)}
        >
          <View style={[styles.checkbox, { borderColor: colors.border }]}>
            {submitToDatabase && (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
          </View>
          <View style={styles.checkboxTextContainer}>
            <Text style={[styles.checkboxLabel, { color: colors.text }]}>
              Submit to Recipe Database
            </Text>
            <Text style={[styles.checkboxDescription, { color: colors.textSecondary }]}>
              Share this recipe with the community
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSaveRecipe}
        >
          <Ionicons name="save-outline" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Save Recipe</Text>
        </TouchableOpacity>
      </ScrollView>

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
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  halfSection: {
    flex: 1,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  inputFlex: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxTextContainer: {
    flex: 1,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  checkboxDescription: {
    fontSize: 13,
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
});
