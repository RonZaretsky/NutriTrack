import { supabase, withTimeout } from './supabaseClient';

// WeightEntry API wrapper for Supabase
export const weightEntryApi = {
  // Get weight entries by user and date range
  async getByUserAndDateRange(email, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('created_by', email)
        .gte('entry_date', startDate)
        .lte('entry_date', endDate)
        .order('entry_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching weight entries:', error);
      return [];
    }
  },

  // Get weight entries by user and specific date
  async getByUserAndDate(email, date) {
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('created_by', email)
        .eq('entry_date', date);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching weight entries for date:', error);
      return [];
    }
  },

  // Get latest weight entry for user
  async getLatestByUser(email) {
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .select('*')
        .eq('created_by', email)
        .order('entry_date', { ascending: false })
        .limit(1)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching latest weight entry:', error);
      return null;
    }
  },

  // Create new weight entry
  async create(entryData) {
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .insert([entryData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating weight entry:', error);
      throw error;
    }
  },

  // Update weight entry
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('weight_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating weight entry:', error);
      throw error;
    }
  },

  // Delete weight entry
  async delete(id) {
    try {
      const { error } = await supabase
        .from('weight_entries')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting weight entry:', error);
      throw error;
    }
  },

  // Filter weight entries (for coach use)
  async filter(filters = {}) {
    try {
      let query = supabase.from('weight_entries').select('*');
      
      // Apply filters
      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      if (filters.entry_date) {
        if (typeof filters.entry_date === 'object' && filters.entry_date.$gte) {
          query = query.gte('entry_date', filters.entry_date.$gte);
        } else {
          query = query.eq('entry_date', filters.entry_date);
        }
      }
      
      // Add ordering if specified
      if (filters.orderBy) {
        query = query.order('entry_date', { ascending: filters.orderBy === 'entry_date' });
      } else {
        query = query.order('entry_date', { ascending: true });
      }
      
      const { data, error } = await withTimeout(query);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error filtering weight entries:', error);
      // Return empty array on timeout or error
      return [];
    }
  }
}; 