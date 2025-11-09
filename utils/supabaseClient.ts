const SUPABASE_URL = 'https://hlyrnwalexksdzibduhm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhseXJud2FsZXhrc2R6aWJkdWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExMDA2MTMsImV4cCI6MjA3NjY3NjYxM30.08rdtd5lFjPeKlAQO1tc67iSpWNQ-CWZc6_bZ_rTIPY';

// Database types
export interface DatabaseRecipe {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string[];
  estimated_time: string;
  serving_size: number;
  calories_per_serving: number;
  created_at: string;
  view_count: number;
  is_popular: boolean;
  image_url?: string;
  category?: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  created_at?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

// Helper function to make Supabase REST API calls
export const supabaseFetch = async (
  endpoint: string,
  method: string = 'GET',
  body?: any
) => {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;

  const headers: any = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  const options: any = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error: ${error}`);
  }

  const data = await response.json();
  return data;
};

// Supabase Authentication Helper Functions
export const supabaseAuth = {
  // Sign up new user
  signUp: async (email: string, password: string) => {
    const url = `${SUPABASE_URL}/auth/v1/signup`;

    console.log('supabaseAuth: Sending signup request...');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    console.log('supabaseAuth: Signup response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('supabaseAuth: Signup failed:', error);
      throw new Error(error.msg || error.message || 'Failed to sign up');
    }

    const data = await response.json();
    console.log('supabaseAuth: Signup response data:', JSON.stringify(data, null, 2));
    return data;
  },

  // Sign in existing user
  signIn: async (email: string, password: string) => {
    const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || error.message || 'Invalid email or password');
    }

    const data = await response.json();

    return {
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
        },
      },
    };
  },

  // Sign out user
  signOut: async (accessToken: string) => {
    const url = `${SUPABASE_URL}/auth/v1/logout`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Failed to sign out');
    }

    return true;
  },

  // Reset password
  resetPassword: async (email: string) => {
    const url = `${SUPABASE_URL}/auth/v1/recover`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || error.message || 'Failed to send reset email');
    }

    return true;
  },

  // Get current user
  getUser: async (accessToken: string) => {
    const url = `${SUPABASE_URL}/auth/v1/user`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || error.message || 'Failed to get user');
    }

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      created_at: data.created_at,
    };
  },

  // Refresh access token using refresh token
  refreshToken: async (refreshToken: string) => {
    const url = `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || error.message || 'Failed to refresh token');
    }

    const data = await response.json();

    return {
      session: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at,
        },
      },
    };
  },
};
