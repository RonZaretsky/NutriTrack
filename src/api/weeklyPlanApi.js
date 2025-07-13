import { supabase, withTimeout } from './supabaseClient';

// WeeklyPlan API wrapper for Supabase
export const weeklyPlanApi = {
  // Get weekly plan by user and week start date
  async getByUserAndWeek(userEmail, weekStartDate) {
    try {
      const { data, error } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('created_by', userEmail)
        .eq('week_start_date', weekStartDate)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error) {
      console.error('Error fetching weekly plan:', error);
      return null;
    }
  },

  // Get weekly plans by user
  async getByUser(userEmail, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('created_by', userEmail)
        .order('week_start_date', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching weekly plans by user:', error);
      return [];
    }
  },

  // Get current week plan
  async getCurrentWeek(userEmail) {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday start
      const weekStartStr = startOfWeek.toISOString().split('T')[0];
      
      return await this.getByUserAndWeek(userEmail, weekStartStr);
    } catch (error) {
      console.error('Error fetching current week plan:', error);
      return null;
    }
  },

  // Create new weekly plan
  async create(planData) {
    try {
      const { data, error } = await supabase
        .from('weekly_plans')
        .insert([planData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating weekly plan:', error);
      throw error;
    }
  },

  // Update weekly plan
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('weekly_plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating weekly plan:', error);
      throw error;
    }
  },

  // Delete weekly plan
  async delete(id) {
    try {
      const { error } = await supabase
        .from('weekly_plans')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting weekly plan:', error);
      throw error;
    }
  },

  // Create or update weekly plan (upsert)
  async upsert(planData) {
    try {
      const { data, error } = await supabase
        .from('weekly_plans')
        .upsert([planData], { 
          onConflict: 'created_by,week_start_date',
          ignoreDuplicates: false 
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting weekly plan:', error);
      throw error;
    }
  },

  // Get weekly plans by date range
  async getByDateRange(userEmail, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('created_by', userEmail)
        .gte('week_start_date', startDate)
        .lte('week_start_date', endDate)
        .order('week_start_date', { ascending: true });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching weekly plans by date range:', error);
      return [];
    }
  },

  // Filter weekly plans
  async filter(filters = {}) {
    try {
      let query = supabase.from('weekly_plans').select('*');
      
      // Apply filters
      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }
      if (filters.week_start_date) {
        query = query.eq('week_start_date', filters.week_start_date);
      }
      
      // Add ordering
      query = query.order('week_start_date', { ascending: false });
      
      const { data, error } = await withTimeout(query);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error filtering weekly plans:', error);
      // Return empty array on timeout or error
      return [];
    }
  }
}; 