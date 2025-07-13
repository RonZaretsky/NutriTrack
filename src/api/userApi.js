import { supabase, getCurrentUser, withTimeout } from './supabaseClient';

// User API wrapper for Supabase
export const userApi = {
  // Get current authenticated user
  async me() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      // Return auth user data directly to avoid RLS issues
      return {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email,
        role: user.user_metadata?.role || 'user',
        is_coach: user.user_metadata?.is_coach || false,
        created_at: user.created_at,
        updated_at: user.updated_at
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  },

  // Get user by email
  async getByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  },

  // Get all users (for admin use)
  async getAll() {
    try {
      // First check if current user is admin
      const currentUser = await this.me();
      if (currentUser.role !== 'admin') {
        console.log('Non-admin user cannot fetch all users');
        return [];
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  },

  // Create new user
  async create(userData) {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Update user
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Delete user
  async delete(id) {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Filter users
  async filter(filters = {}) {
    try {
      let query = supabase.from('users').select('*');
      
      // Apply filters
      if (filters.email) {
        query = query.eq('email', filters.email);
      }
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.is_coach !== undefined) {
        query = query.eq('is_coach', filters.is_coach);
      }
      
      // Add ordering
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error filtering users:', error);
      return [];
    }
  },

  // Check if user is coach
  async isCoach(email) {
    try {
      const user = await this.getByEmail(email);
      return user ? user.is_coach : false;
    } catch (error) {
      console.error('Error checking if user is coach:', error);
      return false;
    }
  },

  // Check if user is admin
  async isAdmin(email) {
    try {
      const user = await this.getByEmail(email);
      return user ? user.role === 'admin' : false;
    } catch (error) {
      console.error('Error checking if user is admin:', error);
      return false;
    }
  }
}; 