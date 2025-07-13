import { supabase, withTimeout } from './supabaseClient'

// Get all food entries for a user and date
export async function getFoodEntriesByUserAndDate(email, date) {
  try {
    const { data, error } = await withTimeout(supabase
      .from('food_entries')
      .select('*')
      .eq('created_by', email)
      .eq('entry_date', date)
      .order('created_at', { ascending: false }));
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting food entries:', error);
    // Return empty array on timeout or error
    return [];
  }
}

// Create a new food entry
export async function createFoodEntry(entry) {
  const { data, error } = await supabase
    .from('food_entries')
    .insert([entry])
    .select()
  if (error) throw error
  return data[0]
}

// Update a food entry
export async function updateFoodEntry(id, updates) {
  const { data, error } = await supabase
    .from('food_entries')
    .update(updates)
    .eq('id', id)
    .select()
  if (error) throw error
  return data[0]
}

// Delete a food entry
export async function deleteFoodEntry(id) {
  const { error } = await supabase
    .from('food_entries')
    .delete()
    .eq('id', id)
  if (error) throw error
  return true
} 