import { supabase } from './supabaseClient';

// ChatState API wrapper for Supabase
export const chatStateApi = {
  // Get chat states by user email
  async getByUser(email) {
    try {
      const { data, error } = await supabase
        .from('chat_states')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chat states:', error);
      return [];
    }
  },

  // Get active chat states (not expired)
  async getActiveStates(email) {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('chat_states')
        .select('*')
        .eq('user_email', email)
        .gt('expires_at', now)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active chat states:', error);
      return [];
    }
  },

  // Get chat state by type
  async getByType(email, stateType) {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('chat_states')
        .select('*')
        .eq('user_email', email)
        .eq('state_type', stateType)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error) {
      console.error('Error fetching chat state by type:', error);
      return null;
    }
  },

  // Create new chat state
  async create(stateData) {
    try {
      const { data, error } = await supabase
        .from('chat_states')
        .insert([stateData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating chat state:', error);
      throw error;
    }
  },

  // Update chat state
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('chat_states')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating chat state:', error);
      throw error;
    }
  },

  // Delete chat state
  async delete(id) {
    try {
      const { error } = await supabase
        .from('chat_states')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting chat state:', error);
      throw error;
    }
  },

  // Delete expired chat states
  async deleteExpired() {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('chat_states')
        .delete()
        .lt('expires_at', now);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting expired chat states:', error);
      throw error;
    }
  },

  // Delete chat states by user
  async deleteByUser(email) {
    try {
      const { error } = await supabase
        .from('chat_states')
        .delete()
        .eq('user_email', email);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting chat states by user:', error);
      throw error;
    }
  },

  // Filter chat states
  async filter(filters = {}) {
    try {
      let query = supabase.from('chat_states').select('*');
      
      // Apply filters
      if (filters.user_email) {
        query = query.eq('user_email', filters.user_email);
      }
      if (filters.state_type) {
        query = query.eq('state_type', filters.state_type);
      }
      if (filters.expires_at) {
        if (typeof filters.expires_at === 'object' && filters.expires_at.$gt) {
          query = query.gt('expires_at', filters.expires_at.$gt);
        } else {
          query = query.eq('expires_at', filters.expires_at);
        }
      }
      
      // Add ordering
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error filtering chat states:', error);
      return [];
    }
  }
}; 