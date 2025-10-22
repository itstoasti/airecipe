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
