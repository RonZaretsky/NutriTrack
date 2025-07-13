import { supabase, withTimeout } from './supabaseClient';

// UserProfile API wrapper for Supabase
export const userProfileApi = {
  // Get user profile by email
  async getByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('created_by', email)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  // Get all profiles (for admin/coach use)
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all user profiles:', error);
      return [];
    }
  },

  // Create new user profile
  async create(profileData) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  // Update user profile
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Delete user profile
  async delete(id) {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  },

  // Filter profiles (for coach use)
  async filter(filters = {}) {
    try {
      let query = supabase.from('user_profiles').select('*');
      
      // Apply filters
      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      if (filters.coach_email) {
        query = query.eq('coach_email', filters.coach_email);
      }
      if (filters.setup_completed !== undefined) {
        query = query.eq('setup_completed', filters.setup_completed);
      }
      
      const { data, error } = await withTimeout(query);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error filtering user profiles:', error);
      // Don't return demo data - throw the error instead
      throw error;
    }
  }
}; 