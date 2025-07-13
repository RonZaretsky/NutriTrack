import { supabase } from './supabaseClient';

// ChatMessage API wrapper for Supabase
export const chatMessageApi = {
  // Get chat messages by user and date
  async getByUserAndDate(email, date) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('created_by', email)
        .eq('chat_date', date)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      return [];
    }
  },

  // Get chat messages by user and date range
  async getByUserAndDateRange(email, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('created_by', email)
        .gte('chat_date', startDate)
        .lte('chat_date', endDate)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching chat messages by date range:', error);
      return [];
    }
  },

  // Get recent chat messages for user
  async getRecentByUser(email, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('created_by', email)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return (data || []).reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching recent chat messages:', error);
      return [];
    }
  },

  // Create new chat message
  async create(messageData) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert([messageData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating chat message:', error);
      throw error;
    }
  },

  // Update chat message
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating chat message:', error);
      throw error;
    }
  },

  // Delete chat message
  async delete(id) {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting chat message:', error);
      throw error;
    }
  },

  // Delete all chat messages for a user and date
  async deleteByUserAndDate(email, date) {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('created_by', email)
        .eq('chat_date', date);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting chat messages for date:', error);
      throw error;
    }
  },

  // Filter chat messages
  async filter(filters = {}) {
    try {
      let query = supabase.from('chat_messages').select('*');
      
      // Apply filters
      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      if (filters.chat_date) {
        query = query.eq('chat_date', filters.chat_date);
      }
      if (filters.sender) {
        query = query.eq('sender', filters.sender);
      }
      if (filters.expires_at) {
        if (typeof filters.expires_at === 'object' && filters.expires_at.$gt) {
          query = query.gt('expires_at', filters.expires_at.$gt);
        }
      }
      
      // Add ordering
      query = query.order('created_at', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error filtering chat messages:', error);
      return [];
    }
  }
}; 