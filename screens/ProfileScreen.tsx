import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getApiKey, saveApiKey, deleteApiKey, getFalApiKey, saveFalApiKey, deleteFalApiKey } from '../utils/storage';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

export default function ProfileScreen({ navigation }: Props) {
  const { colors, isDark, setThemeMode, themeMode } = useTheme();
  const { user, signOut } = useAuth();
  const [openaiApiKey, setOpenaiApiKeyState] = useState('');
  const [hasOpenaiApiKey, setHasOpenaiApiKey] = useState(false);
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [falApiKey, setFalApiKeyState] = useState('');
  const [hasFalApiKey, setHasFalApiKey] = useState(false);
  const [showFalKey, setShowFalKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadOpenaiApiKey();
    loadFalApiKey();
  }, []);

  const loadOpenaiApiKey = async () => {
    try {
      const key = await getApiKey();
      if (key) {
        setOpenaiApiKeyState(key);
        setHasOpenaiApiKey(true);
      }
    } catch (error) {
      console.error('Error loading OpenAI API key:', error);
    }
  };

  const loadFalApiKey = async () => {
    try {
      const key = await getFalApiKey();
      if (key) {
        setFalApiKeyState(key);
        setHasFalApiKey(true);
      }
    } catch (error) {
      console.error('Error loading FAL API key:', error);
    }
  };

  const handleSaveOpenaiApiKey = async () => {
    if (!openaiApiKey.trim()) {
      Alert.alert('Error', 'Please enter an OpenAI API key');
      return;
    }

    setSaving(true);
    try {
      await saveApiKey(openaiApiKey.trim());
      setHasOpenaiApiKey(true);
      Alert.alert('Success', 'OpenAI API key saved successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save OpenAI API key');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveOpenaiApiKey = () => {
    Alert.alert(
      'Remove OpenAI API Key',
      'Are you sure you want to remove your OpenAI API key? You will need to add it again to use recipe generation.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteApiKey();
              setOpenaiApiKeyState('');
              setHasOpenaiApiKey(false);
              Alert.alert('Success', 'OpenAI API key removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove OpenAI API key');
            }
          },
        },
      ]
    );
  };

  const handleSaveFalApiKey = async () => {
    if (!falApiKey.trim()) {
      Alert.alert('Error', 'Please enter a FAL API key');
      return;
    }

    setSaving(true);
    try {
      await saveFalApiKey(falApiKey.trim());
      setHasFalApiKey(true);
      Alert.alert('Success', 'FAL API key saved! Recipe images will now be generated automatically.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save FAL API key');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFalApiKey = () => {
    Alert.alert(
      'Remove FAL API Key',
      'Are you sure you want to remove your FAL API key? Recipe images will no longer be generated.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFalApiKey();
              setFalApiKeyState('');
              setHasFalApiKey(false);
              Alert.alert('Success', 'FAL API key removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove FAL API key');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation will be handled automatically by App.tsx when user state changes
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleThemeChange = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* User Info Section */}
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
          <Text style={[styles.email, { color: colors.text }]}>{user?.email}</Text>
          <Text style={[styles.memberSince, { color: colors.textSecondary }]}>
            Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
          </Text>
        </View>

        {/* Theme Section */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
          <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
            <View style={styles.themeButtons}>
              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: themeMode === 'light' ? colors.primary : colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleThemeChange('light')}
              >
                <Ionicons
                  name="sunny"
                  size={20}
                  color={themeMode === 'light' ? '#fff' : colors.text}
                />
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: themeMode === 'light' ? '#fff' : colors.text },
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: themeMode === 'dark' ? colors.primary : colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleThemeChange('dark')}
              >
                <Ionicons
                  name="moon"
                  size={20}
                  color={themeMode === 'dark' ? '#fff' : colors.text}
                />
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: themeMode === 'dark' ? '#fff' : colors.text },
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: themeMode === 'system' ? colors.primary : colors.inputBackground,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handleThemeChange('system')}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={20}
                  color={themeMode === 'system' ? '#fff' : colors.text}
                />
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: themeMode === 'system' ? '#fff' : colors.text },
                  ]}
                >
                  System
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* OpenAI API Key Section */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>OpenAI API Key (Required)</Text>
          <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
            <View style={styles.apiKeyInfo}>
              <Ionicons name="key-outline" size={24} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>OpenAI API Key</Text>
                <Text style={[styles.apiKeyDescription, { color: colors.textSecondary }]}>
                  {hasOpenaiApiKey
                    ? 'API key configured. Recipe generation is enabled.'
                    : 'Add OpenAI API key to generate recipes'}
                </Text>
              </View>
            </View>

            {!hasOpenaiApiKey ? (
              <>
                <View style={[styles.inputContainer, { marginTop: 12 }]}>
                  <TextInput
                    style={[styles.apiKeyInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter OpenAI API key..."
                    placeholderTextColor={colors.placeholder}
                    value={openaiApiKey}
                    onChangeText={setOpenaiApiKeyState}
                    secureTextEntry={!showOpenaiKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowOpenaiKey(!showOpenaiKey)}
                  >
                    <Ionicons
                      name={showOpenaiKey ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.saveKeyButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveOpenaiApiKey}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={18} color="#fff" />
                      <Text style={styles.saveKeyButtonText}>Save API Key</Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text style={[styles.helpText, { color: colors.placeholder }]}>
                  Get your API key at platform.openai.com/api-keys
                </Text>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.removeKeyButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                onPress={handleRemoveOpenaiApiKey}
              >
                <Ionicons name="trash-outline" size={18} color={colors.primary} />
                <Text style={[styles.removeKeyButtonText, { color: colors.primary }]}>Remove API Key</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* FAL API Key Section */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recipe Images (Optional)</Text>
          <View style={[styles.settingCard, { backgroundColor: colors.card }]}>
            <View style={styles.apiKeyInfo}>
              <Ionicons name="image-outline" size={24} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>FAL.ai API Key</Text>
                <Text style={[styles.apiKeyDescription, { color: colors.textSecondary }]}>
                  {hasFalApiKey
                    ? 'API key configured. Images will be generated for recipes.'
                    : 'Add FAL API key to generate recipe images automatically'}
                </Text>
              </View>
            </View>

            {!hasFalApiKey ? (
              <>
                <View style={[styles.inputContainer, { marginTop: 12 }]}>
                  <TextInput
                    style={[styles.apiKeyInput, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
                    placeholder="Enter FAL API key..."
                    placeholderTextColor={colors.placeholder}
                    value={falApiKey}
                    onChangeText={setFalApiKeyState}
                    secureTextEntry={!showFalKey}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowFalKey(!showFalKey)}
                  >
                    <Ionicons
                      name={showFalKey ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.saveKeyButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveFalApiKey}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="save-outline" size={18} color="#fff" />
                      <Text style={styles.saveKeyButtonText}>Save API Key</Text>
                    </>
                  )}
                </TouchableOpacity>
                <Text style={[styles.helpText, { color: colors.placeholder }]}>
                  Get your free API key at fal.ai/dashboard
                </Text>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.removeKeyButton, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}
                onPress={handleRemoveFalApiKey}
              >
                <Ionicons name="trash-outline" size={18} color={colors.primary} />
                <Text style={[styles.removeKeyButtonText, { color: colors.primary }]}>Remove API Key</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <TouchableOpacity
            style={[styles.settingCard, styles.signOutButton, { backgroundColor: '#FF6B6B' }]}
            onPress={handleSignOut}
          >
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={[styles.appInfoText, { color: colors.textSecondary }]}>
            AI Recipe App v1.0.0
          </Text>
        </View>
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  section: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
  },
  settingsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  themeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  themeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  apiKeyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apiKeyDescription: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  inputContainer: {
    position: 'relative',
  },
  apiKeyInput: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingRight: 48,
    borderRadius: 8,
    fontSize: 14,
    borderWidth: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
  },
  saveKeyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  saveKeyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  removeKeyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
    borderWidth: 1,
  },
  removeKeyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  helpText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  signOutText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  appInfoText: {
    fontSize: 12,
  },
});
