import { supabase } from './supabaseClient';

// Friendship API wrapper for Supabase
export const friendshipApi = {
  // Get friendships by user email
  async getByUser(email) {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_email.eq.${email},friend_email.eq.${email}`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching friendships:', error);
      return [];
    }
  },

  // Get pending friend requests for user
  async getPendingRequests(email) {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .eq('friend_email', email)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending friend requests:', error);
      return [];
    }
  },

  // Get accepted friendships for user
  async getAcceptedFriendships(email) {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`user_email.eq.${email},friend_email.eq.${email}`)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching accepted friendships:', error);
      return [];
    }
  },

  // Create new friendship request
  async create(friendshipData) {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .insert([friendshipData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating friendship:', error);
      throw error;
    }
  },

  // Update friendship status
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating friendship:', error);
      throw error;
    }
  },

  // Delete friendship
  async delete(id) {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting friendship:', error);
      throw error;
    }
  },

  // Check if friendship exists between two users
  async checkFriendship(userEmail, friendEmail) {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`and(user_email.eq.${userEmail},friend_email.eq.${friendEmail}),and(user_email.eq.${friendEmail},friend_email.eq.${userEmail})`)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error) {
      console.error('Error checking friendship:', error);
      return null;
    }
  },

  // Filter friendships
  async filter(filters = {}) {
    try {
      let query = supabase.from('friendships').select('*');
      
      // Apply filters
      if (filters.user_email) {
        query = query.eq('user_email', filters.user_email);
      }
      if (filters.friend_email) {
        query = query.eq('friend_email', filters.friend_email);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      // Add ordering
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error filtering friendships:', error);
      return [];
    }
  }
}; 