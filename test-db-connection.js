// Test database connection and post_ideas table
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 20 chars):', supabaseAnonKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testing basic connection...');
    const { data, error } = await supabase.from('posts').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Posts table error:', error);
    } else {
      console.log('Posts table connection successful, count:', data);
    }
  } catch (err) {
    console.error('Connection error:', err);
  }

  try {
    console.log('Testing post_ideas table...');
    const { data, error } = await supabase.from('post_ideas').select('*').limit(1);
    if (error) {
      console.error('Post ideas table error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('Post ideas table connection successful, sample data:', data);
    }
  } catch (err) {
    console.error('Post ideas connection error:', err);
  }
}

testConnection();
