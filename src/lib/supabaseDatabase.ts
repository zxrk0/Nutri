import { supabase } from './supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MealLibraryItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  created_at: string;
}

export interface DailyEntry {
  id: string;
  date: string;
  meal_name: string;
  calories: number;
  protein: number;
  quantity: number;
  created_at: string;
}

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
}

export interface UserSettings {
  calorie_goal: number;
  protein_goal: number;
  username: string;
  profile_picture?: string;
}

export interface DailySummary {
  date: string;
  total_calories: number;
  total_protein: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

async function uid(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error('Not authenticated');
  return data.user.id;
}

function dateMinusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// Pas utilisé en web mais requis par l'interface existante
export async function initDatabase(): Promise<void> {}

// ─── Meals Library ────────────────────────────────────────────────────────────

export async function getMealsLibrary(): Promise<MealLibraryItem[]> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('meals_library')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addMealToLibrary(
  name: string,
  calories: number,
  protein: number
): Promise<string> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('meals_library')
    .insert({ user_id: userId, name, calories, protein })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateMealInLibrary(
  id: string,
  name: string,
  calories: number,
  protein: number
): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('meals_library')
    .update({ name, calories, protein })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function deleteMealFromLibrary(id: string): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('meals_library')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── Daily Entries ────────────────────────────────────────────────────────────

export async function getDailyEntries(date: string): Promise<DailyEntry[]> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('daily_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addDailyEntry(
  date: string,
  meal_name: string,
  calories: number,
  protein: number,
  quantity: number = 1
): Promise<string> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('daily_entries')
    .insert({ user_id: userId, date, meal_name, calories: calories * quantity, protein: protein * quantity, quantity })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function deleteDailyEntry(id: string): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('daily_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function getWeeklySummary(): Promise<DailySummary[]> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('daily_entries')
    .select('date, calories, protein')
    .eq('user_id', userId)
    .gte('date', dateMinusDays(6))
    .order('date', { ascending: true });
  if (error) throw error;

  const map: Record<string, { calories: number; protein: number }> = {};
  for (const row of data ?? []) {
    if (!map[row.date]) map[row.date] = { calories: 0, protein: 0 };
    map[row.date].calories += row.calories;
    map[row.date].protein += row.protein;
  }
  return Object.entries(map).map(([date, v]) => ({
    date,
    total_calories: Math.round(v.calories),
    total_protein: Math.round(v.protein * 10) / 10,
  }));
}

export async function getHistory(): Promise<DailySummary[]> {
  const userId = await uid();
  const today = todayString();
  const { data, error } = await supabase
    .from('daily_entries')
    .select('date, calories, protein')
    .eq('user_id', userId)
    .lt('date', today)
    .order('date', { ascending: false });
  if (error) throw error;

  const map: Record<string, { calories: number; protein: number }> = {};
  for (const row of data ?? []) {
    if (!map[row.date]) map[row.date] = { calories: 0, protein: 0 };
    map[row.date].calories += row.calories;
    map[row.date].protein += row.protein;
  }
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, v]) => ({
      date,
      total_calories: Math.round(v.calories),
      total_protein: Math.round(v.protein * 10) / 10,
    }));
}

// ─── Weight Entries ───────────────────────────────────────────────────────────

export async function getWeightEntries(): Promise<WeightEntry[]> {
  const userId = await uid();
  const { data, error } = await supabase
    .from('weight_entries')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addWeightEntry(date: string, weight: number): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('weight_entries')
    .upsert({ user_id: userId, date, weight }, { onConflict: 'user_id,date' });
  if (error) throw error;
}

export async function deleteWeightEntry(id: string): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('weight_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// ─── User Settings ────────────────────────────────────────────────────────────

export async function getUserSettings(): Promise<UserSettings> {
  const userId = await uid();
  const { data } = await supabase
    .from('user_settings')
    .select('calorie_goal, protein_goal, username, profile_picture')
    .eq('user_id', userId)
    .single();
  return data ?? { calorie_goal: 2500, protein_goal: 150, username: 'Moi' };
}

export async function updateUserSettings(settings: Partial<UserSettings>): Promise<void> {
  const userId = await uid();
  const { error } = await supabase
    .from('user_settings')
    .update(settings)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateProfilePicture(uri: string): Promise<void> {
  await updateUserSettings({ profile_picture: uri });
}
