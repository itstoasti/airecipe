import { supabaseFetch } from './supabaseClient';

// Cache for API keys to avoid multiple requests
let cachedKeys: { [key: string]: string } = {};

/**
 * Fetch API key from Supabase server-side storage
 * Keys are cached in memory for the session
 */
export const getServerApiKey = async (keyName: string, accessToken: string): Promise<string> => {
  // Return cached key if available
  if (cachedKeys[keyName]) {
    return cachedKeys[keyName];
  }

  try {
    // Call Supabase function to get API key
    const response = await fetch(
      `https://hlyrnwalexksdzibduhm.supabase.co/rest/v1/rpc/get_api_key`,
      {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhseXJud2FsZXhrc2R6aWJkdWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDA2MTMsImV4cCI6MjA3NjY3NjYxM30.08rdtd5lFjPeKlAQO1tc67iSpWNQ-CWZc6_bZ_rTIPY',
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key_name: keyName }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to fetch API key ${keyName}:`, error);
      throw new Error(`Failed to fetch API key: ${keyName}`);
    }

    const key = await response.json();

    if (!key) {
      throw new Error(`API key not found: ${keyName}`);
    }

    // Cache the key
    cachedKeys[keyName] = key;
    return key;
  } catch (error) {
    console.error('Error fetching API key from Supabase:', error);
    throw error;
  }
};

/**
 * Get OpenAI API key from Supabase
 */
export const getOpenAIKey = async (accessToken: string): Promise<string> => {
  return getServerApiKey('openai_api_key', accessToken);
};

/**
 * Get FAL API key from Supabase
 */
export const getFALKey = async (accessToken: string): Promise<string> => {
  return getServerApiKey('fal_api_key', accessToken);
};

/**
 * Clear cached keys (useful for testing or security)
 */
export const clearKeyCache = () => {
  cachedKeys = {};
};
