import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://dvdzyfdszvxklisxyrva.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZHp5ZmRzenZ4a2xpc3h5cnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzMjM5MzAsImV4cCI6MjA5MDg5OTkzMH0.nV_ktSbW8N4sBF4nhOjoWzdVYmhsZN6xBhqqbnjevKs';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
