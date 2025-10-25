import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { saveApiKey } from '../utils/storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type ApiKeySetupScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ApiKeySetup'
>;

interface Props {
  navigation: ApiKeySetupScreenNavigationProp;
}

export default function ApiKeySetupScreen({ navigation }: Props) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter your OpenAI API key');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      Alert.alert('Error', 'Invalid API key format. OpenAI API keys start with "sk-"');
      return;
    }

    setLoading(true);

    try {
      await saveApiKey(apiKey.trim());
      Alert.alert('Success', 'API key saved successfully!');
      setLoading(false);
      // Trigger re-render by attempting navigation - app will auto-navigate to correct screen
      setTimeout(() => {
        try {
          navigation.navigate('MainTabs' as any);
        } catch (e) {
          // Expected - MainTabs might not be available yet, app will handle navigation
        }
      }, 500);
    } catch (error) {
      Alert.alert('Error', 'Failed to save API key. Please try again.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="key" size={60} color="#FF6B6B" />
        <Text style={styles.title}>Welcome to AI Recipe App</Text>
        <Text style={styles.subtitle}>
          To get started, please enter your OpenAI API key
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>OpenAI API Key</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="sk-..."
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry={secureTextEntry}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setSecureTextEntry(!secureTextEntry)}
          >
            <Ionicons
              name={secureTextEntry ? 'eye-off' : 'eye'}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.helpText}>
          Your API key is stored securely on your device and never shared.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleSaveApiKey}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save & Continue</Text>
        )}
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Don't have an API key?</Text>
        <Text style={styles.infoText}>
          1. Visit platform.openai.com{'\n'}
          2. Sign up or log in{'\n'}
          3. Navigate to API Keys section{'\n'}
          4. Create a new secret key
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    marginTop: 30,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
  },
});
