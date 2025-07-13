import { supabase } from './supabaseClient';

// Authentication API wrapper for Supabase
export const authApi = {
  // Get the correct redirect URL based on environment
  getRedirectUrl(path) {
    // In production (GitHub Pages), use the correct domain
    if (import.meta.env.VITE_APP_ENV === 'production' || (!import.meta.env.DEV && window.location.hostname !== 'localhost')) {
      return `https://ronzaretsky.github.io/NutriTrack${path}`;
    }
    
    // In development, use localhost
    return `${window.location.origin}${path}`;
  },
  // Sign up with email and password
  async signUp(email, password, fullName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'user',
            is_coach: false
          },
          emailRedirectTo: this.getRedirectUrl('/auth/callback')
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  // Sign in with email and password
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  // Sign in with magic link (passwordless)
  async signInWithMagicLink(email) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: this.getRedirectUrl('/auth/callback')
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sending magic link:', error);
      throw error;
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Reset password
  async resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: this.getRedirectUrl('/auth/reset-password')
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  // Update password
  async updatePassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  },

  // Update user profile
  async updateProfile(updates) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },

  // Check if user is authenticated
  async isAuthenticated() {
    const session = await this.getSession();
    return !!session;
  },

  // Get user role
  async getUserRole() {
    try {
      const { data, error } = await supabase.rpc('get_user_role');
      if (error) {
        console.error('Error getting user role from RPC:', error);
        return 'user'; // Default fallback
      }
      return data || 'user';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'user'; // Default fallback
    }
  },

  // Check if user is admin
  async isAdmin() {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) {
        console.error('Error checking admin status from RPC:', error);
        return false; // Default fallback
      }
      return data || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false; // Default fallback
    }
  },

  // Check if user is coach
  async isCoach() {
    try {
      const { data, error } = await supabase.rpc('is_coach');
      if (error) {
        console.error('Error checking coach status from RPC:', error);
        return false; // Default fallback
      }
      return data || false;
    } catch (error) {
      console.error('Error checking coach status:', error);
      return false; // Default fallback
    }
  }
}; 