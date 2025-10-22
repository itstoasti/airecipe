import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

type ShoppingListScreenRouteProp = RouteProp<RootStackParamList, 'ShoppingList'>;
type ShoppingListScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ShoppingList'
>;

interface Props {
  route: ShoppingListScreenRouteProp;
  navigation: ShoppingListScreenNavigationProp;
}

interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
}

export default function ShoppingListScreen({ route, navigation }: Props) {
  const { recipe } = route.params;
  const { colors } = useTheme();

  const [items, setItems] = useState<ShoppingItem[]>(
    recipe.ingredients.map((ingredient, index) => ({
      id: `item-${index}`,
      name: ingredient,
      checked: false,
    }))
  );

  const toggleItem = (id: string) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleShare = async () => {
    try {
      const checkedItems = items.filter((item) => item.checked);
      const uncheckedItems = items.filter((item) => !item.checked);

      let message = `Shopping List for ${recipe.title}\n\n`;

      if (uncheckedItems.length > 0) {
        message += 'To Buy:\n';
        uncheckedItems.forEach((item) => {
          message += `☐ ${item.name}\n`;
        });
      }

      if (checkedItems.length > 0) {
        message += '\nPurchased:\n';
        checkedItems.forEach((item) => {
          message += `☑ ${item.name}\n`;
        });
      }

      await Share.share({
        message,
        title: `Shopping List: ${recipe.title}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share shopping list');
    }
  };

  const handleClearChecked = () => {
    Alert.alert(
      'Clear Checked Items',
      'Remove all checked items from the list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setItems((prevItems) => prevItems.filter((item) => !item.checked));
          },
        },
      ]
    );
  };

  const checkedCount = items.filter((item) => item.checked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <TouchableOpacity
      style={[styles.itemContainer, { backgroundColor: colors.card }]}
      onPress={() => toggleItem(item.id)}
    >
      <View
        style={[
          styles.checkbox,
          { borderColor: colors.border },
          item.checked && [styles.checkboxChecked, { backgroundColor: colors.teal, borderColor: colors.teal }],
        ]}
      >
        {item.checked && <Ionicons name="checkmark" size={18} color="#fff" />}
      </View>
      <Text
        style={[
          styles.itemText,
          { color: colors.text },
          item.checked && [styles.itemTextChecked, { color: colors.textSecondary }],
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Shopping List</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.recipeInfo, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.recipeName, { color: colors.text }]}>{recipe.title}</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.inputBackground }]}>
            <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: colors.teal }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {checkedCount} of {totalCount} items
          </Text>
        </View>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cart-outline" size={80} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No ingredients in this recipe</Text>
          </View>
        }
      />

      {checkedCount > 0 && (
        <View style={[styles.bottomActions, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClearChecked}
          >
            <Ionicons name="trash-outline" size={20} color={colors.primary} />
            <Text style={[styles.clearButtonText, { color: colors.primary }]}>Clear Checked Items</Text>
          </TouchableOpacity>
        </View>
      )}
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
  recipeInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recipeName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  itemTextChecked: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  bottomActions: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: '600',
  },
});
